/// <reference path="../../../common/menu/controller/DiagramMenuController.ts" />
/// <reference path="../../../robots/interpreter/Interpreter.ts" />
/// <reference path="../../../common/interfaces/editorCore.d.ts" />
/// <reference path="../../../common/interfaces/vendor.d.ts" />
/// <reference path="BPMNSceneController.ts" />

class BPMNDiagramEditorController extends DiagramEditorController {

    private menuController: DiagramMenuController;
    private diagramInterpreter: Interpreter;

    constructor($scope, $attrs) {
        super($scope, $attrs);
        this.sceneController = new BPMNSceneController(this, this.diagramEditor.getScene());
        this.menuController = new DiagramMenuController(this);
        this.diagramInterpreter = new Interpreter();

        $scope.createNewDiagram = () => { this.menuController.createNewDiagram(); };
        $scope.openFolderWindow = () => { this.menuController.openFolderWindow(); };
        $scope.saveCurrentDiagram = () => { this.menuController.saveCurrentDiagram(); };
        $scope.saveDiagramAs = () => { this.menuController.saveDiagramAs(); };
        $scope.clearAll = () => { this.clearAll(); };

        this.elementsTypeLoader.load((elementTypes: ElementTypes): void => {
            this.handleLoadedTypes(elementTypes);
        }, "", "bpmn");
    }

    public handleLoadedTypes(elementTypes: ElementTypes): void {
        this.propertyEditorController = new PropertyEditorController(this.sceneController, this.undoRedoController);

        for (var typeName in elementTypes.uncategorisedTypes) {
            this.nodeTypesMap[typeName] = elementTypes.uncategorisedTypes[typeName];
        }

        $.extend(this.nodeTypesMap, elementTypes.blockTypes.convertToMap(), elementTypes.flowTypes.convertToMap());

        this.paletteController.appendBlocksPalette(elementTypes.blockTypes);
        this.paletteController.appendFlowsPalette(elementTypes.flowTypes);
        this.paletteController.initDraggable();
        this.paletteController.initClick(this.diagramEditor.getScene());
    }

    public clearAll(): void {
        this.clearState();
        this.menuController.clearState();
    }

}