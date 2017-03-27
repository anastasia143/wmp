requirejs.config({
    baseUrl: 'resources/js/compiled',
    paths: {
        angular: '../libs/angular/angular',

        jquery: '../libs/jquery/jquery',
        jqueryui: '../libs/jquery/ui/jquery-ui',
        jquerytree: '../libs/jquery/treeview/jquery.treeview',

        lodash: '../libs/lodash/lodash',
        backbone: '../libs/backbone/backbone',

        bootstrap: '../libs/bootstrap/bootstrap',

        jointjs: '../libs/joint/joint',
        graphlib: '../libs/graphlib/graphlib',
        dagre: '../libs/dagre/dagre'
    },
    shim: {
        angular: {
            exports: 'angular',
        },
        jqueryui: ['jquery'],
        jquerytree: ['jquery'],
        bootstrap: ['jquery']

    },
    map: {
        '*': {
            'underscore': 'lodash'
        }
    }
});

requirejs(
    ['jointjs']
    , function (joint) {
        console.log('Adding joint to global');
        this.joint = joint;
    });

requirejs(
    ['lodash']
    , function (lodash) {
        console.log('Adding lodash to global');
        this._ = lodash;
    });

requirejs(
    ['graphlib']
    , function (graphlib) {
        console.log('Adding graphlib to global');
        this.graphlib = graphlib;
    });

requirejs(
    ['dagre']
    , function (dagre) {
        console.log('Adding dagre to global');
        this.dagre = dagre;
    });

requirejs(
    ['angular', 'jointjs',
    'jquery', 'jqueryui', 'jquerytree',
    'lodash', 'backbone', 'graphlib', 'dagre',
    'bootstrap',
    'require/app',
    'robots/RootDiagramController',
    'robots/diagram/controller/RobotsDiagramEditorController',
    'robots/twoDModel/implementations/engine/TwoDModelEngineFacadeImpl',
    'bpmn/diagram/controller/BpmnDiagramEditorController',
    'core/editorCore/controller/DiagramEditorController']
    , function (angular) {
    console.log('Bootstraping Angular called');
    angular.bootstrap(document, ['myApp']);
});

