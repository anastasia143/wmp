/// <reference path="SceneController.ts" />
/// <reference path="PropertyEditorController.ts" />
/// <reference path="loaders/ElementsTypeLoader.ts" />
/// <reference path="PaletteController.ts" />
/// <reference path="parsers/DiagramJsonParser.ts" />
/// <reference path="exporters/DiagramExporter.ts" />
/// <reference path="../model/DiagramEditor.ts" />
/// <reference path="../model/Map.ts"/>
/// <reference path="../../../vendor.d.ts" />

class DiagramEditorController {

    protected diagramEditor: DiagramEditor;
    protected sceneController: SceneController;
    protected propertyEditorController: PropertyEditorController;
    protected elementsTypeLoader: ElementsTypeLoader;
    protected paletteController: PaletteController;
    protected nodeTypesMap: Map<NodeType>;
    protected undoRedoController: UndoRedoController;

    constructor($scope, $attrs) {
        this.undoRedoController = new UndoRedoController();
        this.nodeTypesMap = {};
        this.paletteController = new PaletteController();
        DiagramElementListener.getNodeProperties = (type: string): Map<Property> => {
            return this.getNodeProperties(type);
        };
        this.diagramEditor = new DiagramEditor();
        this.sceneController = new SceneController(this, this.diagramEditor.getScene());
        this.elementsTypeLoader = new ElementsTypeLoader();

        $scope.undo = () => {
            this.undoRedoController.undo();
        };

        $scope.redo = () => {
            this.undoRedoController.redo();
        };

        $(document).bind("mousedown", function (e) {
            if (!($(e.target).parents(".custom-menu").length > 0)) {
                $(".custom-menu").hide(100);
            }
        });
    }

    public getGraph(): joint.dia.Graph {
        return this.diagramEditor.getGraph();
    }

    public getNodesMap(): Map<DiagramNode> {
        var paper = this.diagramEditor.getScene();
        return paper.getNodesMap();
    }

    public getLinksMap(): Map<Link> {
        var paper = this.diagramEditor.getScene();
        return paper.getLinksMap();
    }

    public setNodeProperties(element: DiagramElement): void {
        this.propertyEditorController.setNodeProperties(element)
    }

    public clearNodeProperties(): void {
        this.propertyEditorController.clearState();
    }

    public getNodeType(type: string): NodeType {
        return this.nodeTypesMap[type];
    }

    public getNodeProperties(type: string): Map<Property> {
        return this.nodeTypesMap[type].getPropertiesMap();
    }

    public getUndoRedoController(): UndoRedoController {
        return this.undoRedoController;
    }

    public clearState(): void {
        this.propertyEditorController.clearState();
        this.sceneController.clearState();
        this.diagramEditor.clear();
        this.undoRedoController.clearStack();
    }

    public getDiagramParts(): DiagramParts {
        return new DiagramParts(this.getNodesMap(), this.getLinksMap());
    }

    public getNodeTypes(): Map<NodeType> {
        return this.nodeTypesMap;
    }

    public addFromMap(diagramParts: DiagramParts): void {
        var scene = this.diagramEditor.getScene();
        scene.addNodesFromMap(diagramParts.nodesMap);
        scene.addLinksFromMap(diagramParts.linksMap);
    }

    private makeLink(parentElementLabel, childElementLabel) {
        return new joint.dia.Link({
            source: { id: parentElementLabel },
            target: { id: childElementLabel },
            attrs: { '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' } },
            smooth: true
        });
    }

    private makeElement(label) {
        var maxLineLength = _.max(label.split('\n'), function(l) { return l.length; }).length;

        var letterSize = 8;
        var width = 2 * (letterSize * (0.6 * maxLineLength + 1));
        var height = 2 * ((label.split('\n').length + 1) * letterSize);

        return new joint.shapes.basic.Rect({
            id: label,
            size: { width: width, height: height },
            attrs: {
                text: { text: label, 'font-size': letterSize, 'font-family': 'monospace' },
                rect: {
                    width: width, height: height,
                    rx: 5, ry: 5,
                    stroke: '#555'
                }
            }
        });
    }

    private buildGraphFromAdjacencyList(adjacencyList) {
        var elements = [];
        var links = [];

        _.each(adjacencyList, function(edges, parentElementLabel) {
            elements.push(this.makeElement(parentElementLabel));

            _.each(edges, function(childElementLabel) {
                links.push(this.makeLink(parentElementLabel, childElementLabel));
            });
        });

        return elements.concat(links);
    }

    public layoutDiagram(diagramId: Number): void {
        var graph = this.diagramEditor.getGraph();
        var scene = this.diagramEditor.getScene();

        var adjacencyList;
        var cells = this.buildGraphFromAdjacencyList(adjacencyList);
        graph.resetCells(cells);

        joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
    }
}