package models

import com.github.nscala_time.time.Imports._
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.db.slick.Config.driver.simple._
import play.api.db.slick.DB
import play.api.Play.current
import utils.DateConversions._

object EventType extends Enumeration {
    val Normal    = Value("Normal")
    val Scheduled = Value("Scheduled")
    val WorkChunk = Value("WorkChunk") 
}

case class Event(
    var id: Option[Int] = None,
    eventType: EventType.Value = EventType.Normal,
    task: Option[Task] = None,
    startTime: DateTime,
    endTime: DateTime,
    where: String = "",
    description: String = ""
) {
    val duration: Duration = new Duration(startTime, endTime)

    def insert() = { 
        // Ensure this Event hasn't already been put into the database
        id match {
            case Some(_) => throw new CloneNotSupportedException
            case None => // do nothing
        }

        DB.withSession { implicit session =>
            id = Some((TableQuery[EventModel] returning TableQuery[EventModel].map(_.id)) += this) 
	}
    }
}

object Event {
    implicit val implicitDurationWrites = new Writes[Duration] {
        def writes(duration: Duration): JsValue = JsNumber(duration.millis)
    }

    val dateFormatter = DateTimeFormat.forPattern("yyyy-MM-dd'T'HH:mm:ss.SSSZ")

    implicit val implicitEventWrites = new Writes[Event] {
        def writes(event: Event): JsValue = {
            val taskID = event.task match {
                case Some(task) =>
                    task.id 
                case None =>
                    None 
            }

            Json.obj(
              "id" -> event.id.get,
              "eventType" -> event.eventType.toString,
              "task" -> taskID,
              "start_date" -> dateFormatter.print(event.startTime.getMillis),
              "end_date" -> dateFormatter.print(event.endTime.getMillis),
              "where" -> event.where,
              "text" -> event.description)
        }
    }
}

class EventModel(tag: Tag) extends Table[Event](tag, "Event") {
    implicit def implicitEventTypeColumnMapper = 
        MappedColumnType.base[EventType.Value, String](
            etv => etv.toString,
            s => EventType.withName(s)
        )

    def id = column[Int]("id", O.PrimaryKey, O.AutoInc)
    def eventType = column[EventType.Value]("eventType")
    def task = column[Option[Task]]("task")
    def start = column[DateTime]("start")
    def end = column[DateTime]("end")
    def where = column[String]("where")
    def description = column[String]("description")
    def event = Event.apply _
    def * = (
      id.?, 
      eventType, 
      task, 
      start, 
      end, 
      where, 
      description
    ) <> (event.tupled, Event.unapply _)
}
