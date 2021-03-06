var accioApp = angular.module('accioApp', ['ngResource', 'ui.bootstrap', 'ui-rangeSlider']);

/*accioApp.config(["$routeProvider", function($routeprovider){
	return $routeProvider
		.when('/', {
			templateUrl: 'views/tasks.scala.html',
			controller: 'TaskCtrl'
		})
		.when('/calendar', {
			templateUrl: 'views/calendar',
			controller: 'CalendarCtrl'
		})
		.when('/testroute', {
			templateUrl: 'views/broken',
			//controller: 'CalendarCtrl'
		})
		.otherwise({
			redirectTo: '/'
		})
	});*/
		

accioApp.factory('Task', ['$resource', function($resource){
		return $resource('api/tasks/:taskId', {}, {
			getTasks: {method:'GET', isArray:true},
			createTask: {method:'POST', params: {title : '@title'}},
                        editTaskTitle: {method:'POST', params: {title : '@title'}}
			//deleteTask: {method:'DELETE', params: {"taskId" : taskId}}
		});
	}
]);

//This service acts as our task repository/ source of task truth
accioApp.service('TaskService', ['Task', '$http', '$rootScope', function(Task, $http, $rootScope) {
	var service = {
		tasks : [],

		refreshTasks : function() {
			Task.getTasks(function(data) {
				console.log(data);
				service.tasks = data;
				$rootScope.$broadcast('tasks.update');
			});
		}
	}
	return service;
}])

accioApp.controller('TaskCtrl', ['$scope', '$http', 'TaskService', function($scope, $http, TaskService) {

	$scope.tasks = [];
	$scope.selectedTask = null;

	var emptyTask = {id : null,
                title : "", 
		description : "", 
        dueDate : "",
		estimatedTime : 0,
		subtasks : null,
		editMode : true};

	$scope.update = function() {
		TaskService.refreshTasks();
	}

	$scope.createTask = function() {
		//Set our selected task to our new task so it can be edited
		$scope.selectedTask = angular.copy(emptyTask);
	}

	$scope.deleteTask = function(id) {
		$http.delete('api/tasks/'+id).success(function() {
			$scope.update();
		});
	}

	$scope.selectTask = function(task) {
		$scope.selectedTask = task;
	}

	$scope.$on('tasks.update', function (event) {
		$scope.tasks = TaskService.tasks;
		if (!$scope.selectedTask) {
			$scope.selectedTask = $scope.tasks[0];
		};
	})

	$scope.update();
}]);

accioApp.directive('categoryList', function() {
	return {
		//Only apply this directive to elements with this name
		restrict: 'A',
		//replace the element with the template
		replace: true,
		templateUrl: "/assets/directives/categoryList.partial.html",
		link: function(scope, element, attributes) {
			scope.categories = ["All Tasks", "Homework", "Errands", "Programming Projects"];
		}

	}
});

accioApp.directive('taskList', function() {
	return {
		//Only apply this directive to elements with this name
		restrict: 'A',
		//replace the element with the template
		replace: true,
		templateUrl: "/assets/directives/taskList.partial.html"
	}
});

accioApp.directive('taskDetail', ['Task', '$http', 'TaskService', function(Task, $http, TaskService) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: "/assets/directives/taskDetail.partial.html",
		scope : {
			task : '=selectedTask'
		},
		link: function(scope, element, attributes) {

			scope.saveTask = function() {
				//Task.createTask
				var serverTask = {id : scope.task.id, title : scope.task.title, description: scope.task.description, dueDate : scope.task.dueDate, estimatedTime: scope.task.estimatedTime};
				console.log(serverTask);
				$http.post('api/tasks', serverTask).success(function(data) {
					console.log(data);
					TaskService.refreshTasks()
				});
				scope.task.editMode = false;
			}

			scope.editTask = function() {
				scope.task.editMode = true;
			}
		}	
	}
}]);
