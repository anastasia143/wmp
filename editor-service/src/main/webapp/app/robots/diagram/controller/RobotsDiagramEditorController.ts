/// <reference path="../../../common/menu/controller/DiagramMenuController.ts" />
/// <reference path="../../../robots/interpreter/Interpreter.ts" />
/// <reference path="../../../common/interfaces/editorCore.d.ts" />
/// <reference path="../../../common/interfaces/vendor.d.ts" />
/// <reference path="../../../common/gestures/GesturesController.ts" />
/// <reference path="../../../common/constants/MouseButton.ts" />

class RobotsDiagramEditorController extends DiagramEditorController {

    private menuController: DiagramMenuController;
    private gesturesController: GesturesController;
    private diagramInterpreter: Interpreter;

    constructor($scope, $attrs) {
        super($scope, $attrs);

        var scene: DiagramScene = this.diagramEditor.getScene();
        this.menuController = new DiagramMenuController(this);
        this.gesturesController = new GesturesController(this.sceneController, this.diagramEditor.getScene());
        this.diagramInterpreter = new Interpreter();

        document.addEventListener('mousedown', (event) => { this.gesturesController.onMouseDown(event) } );
        document.addEventListener('mouseup', (event) => { this.gesturesController.onMouseUp(event) } );
        $("#" + scene.getId()).mousemove((event) => { this.gesturesController.onMouseMove(event) } );

        (scene as any).on('cell:pointerdown', (cellView, event, x, y): void => {
            this.cellPointerdownListener(cellView, event, x, y);
        });
        (scene as any).on('blank:pointerdown', (event, x, y): void => {
            this.blankPoinerdownListener(event, x, y);
        });

        $scope.openTwoDModel = () => { this.openTwoDModel(); };
        $scope.createNewDiagram = () => { this.menuController.createNewDiagram(); };
        $scope.openFolderWindow = () => { this.menuController.openFolderWindow(); };
        $scope.saveCurrentDiagram = () => { this.menuController.saveCurrentDiagram(); };
        $scope.saveDiagramAs = () => { this.menuController.saveDiagramAs(); };
        $scope.layoutDiagram = () => { this.menuController.layoutDiagram(); };
        $scope.clearAll = () => { this.clearAll(); };

        $scope.$on("interpret", (event, timeline) => {
            this.diagramInterpreter.interpret(this.getGraph(), this.getNodesMap(), this.getLinksMap(), timeline);
        });

        $scope.$on("stop", (event) => {
            this.diagramInterpreter.stop();
        });

        this.elementsTypeLoader.load((elementTypes: ElementTypes): void => {
            this.handleLoadedTypes(elementTypes);
        });
    }

    public handleLoadedTypes(elementTypes: ElementTypes): void {
        this.propertyEditorController = new PropertyEditorController(this.sceneController, this.undoRedoController);

        for (var typeName in elementTypes.uncategorisedTypes) {
            this.nodeTypesMap[typeName] = elementTypes.uncategorisedTypes[typeName];
        }

        var categories: Map<Map<NodeType>> = elementTypes.paletteTypes.categories;
        for (var category in categories) {
            for (var typeName in categories[category]) {
                this.nodeTypesMap[typeName] = categories[category][typeName];
            }
        }

        this.paletteController.appendBlocksPalette(elementTypes.paletteTypes);
        this.paletteController.initDraggable();
    }

    public openTwoDModel(): void {
        $("#diagram-area").hide();
        $("#two-d-model-area").show();
    }

    public clearAll(): void {
        this.clearState();
        this.menuController.clearState();
    }

    private blankPoinerdownListener(event, x, y): void {
        if (event.button == MouseButton.right) {
            this.gesturesController.startDrawing();
        }
    }

    private cellPointerdownListener(cellView, event, x, y): void {
        if (event.button == MouseButton.right) {
            this.gesturesController.startDrawing();
        }
    }
}