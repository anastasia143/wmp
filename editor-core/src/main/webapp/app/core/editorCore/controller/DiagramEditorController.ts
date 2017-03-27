/// <reference path="../../../vendor.d.ts" />
import {PropertyEditorController} from "./PropertyEditorController";
import {ElementTypes} from "../model/ElementTypes";
import {DiagramParts} from "../model/DiagramParts";
import {NodeType} from "../model/NodeType";
import {UndoRedoController} from "./UndoRedoController";
import {Property} from "../model/Property";
import {DiagramElement} from "../model/DiagramElement";
import {Link} from "../model/Link";
import {DiagramNode} from "../model/DiagramNode";
import {ElementsTypeLoader} from "./loaders/ElementsTypeLoader";
import {SceneController} from "./SceneController";
import {DiagramEditor} from "../model/DiagramEditor";
import {DiagramElementListener} from "./DiagramElementListener";
import {PaletteController} from "./PaletteController";
export class DiagramEditorController {

    protected diagramEditor: DiagramEditor;
    protected sceneController: SceneController;
    protected propertyEditorController: PropertyEditorController;
    protected elementsTypeLoader: ElementsTypeLoader;
    protected paletteController: PaletteController;
    protected nodeTypesMap: Map<String, NodeType>;
    protected linkPatternsMap: Map<String, joint.dia.Link>;
    protected undoRedoController: UndoRedoController;
    protected elementTypes: ElementTypes;

    constructor($scope, $attrs) {
        this.undoRedoController = new UndoRedoController();
        this.nodeTypesMap = new Map<String, NodeType>();
        this.linkPatternsMap = new Map<String, joint.dia.Link>();
        this.paletteController = new PaletteController();
        DiagramElementListener.getNodeType = (type: string): NodeType => {
            return this.getNodeType(type);
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

    public getNodesMap(): Map<String, DiagramNode> {
        var paper = this.diagramEditor.getScene();
        return paper.getNodesMap();
    }

    public getLinksMap(): Map<String, Link> {
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

    public getNodeProperties(type: string): Map<String, Property> {
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

    public getNodeTypes(): Map<String, NodeType> {
        return this.nodeTypesMap;
    }

    public getLinkPatterns(): Map<String, joint.dia.Link> {
        return this.linkPatternsMap;
    }

    public addFromMap(diagramParts: DiagramParts): void {
        var scene = this.diagramEditor.getScene();
        scene.addNodesFromMap(diagramParts.nodesMap);
        scene.addLinksFromMap(diagramParts.linksMap);
    }

    protected handleLoadedTypes(elementTypes: ElementTypes): void {
        this.propertyEditorController = new PropertyEditorController(this.sceneController, this.undoRedoController);

        this.elementTypes = elementTypes;

        $.extend(this.linkPatternsMap, elementTypes.linkPatterns);
        $.extend(this.nodeTypesMap, elementTypes.blockTypes.convertToMap(), elementTypes.flowTypes.convertToMap(),
            elementTypes.uncategorisedTypes);

        this.paletteController.appendBlocksPalette(elementTypes.blockTypes);
        this.paletteController.appendFlowsPalette(elementTypes.flowTypes);
        this.paletteController.initDraggable();
        this.paletteController.initClick(this.diagramEditor.getScene());
        this.diagramEditor.getScene().setLinkPatterns(this.linkPatternsMap);
    }

    private makeLink(parentElementLabel, childElementLabel) {
        return new joint.dia.Link({
            source: { id: parentElementLabel },
            target: { id: childElementLabel },
            attrs: { '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' } },
            smooth: true
        });
    }

    private makeElement(label: string) {
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

    private buildGraphFromAdjacencyList(oldElements:  joint.dia.Element[], oldLinks:  joint.dia.Link[]) {
        var elements = [];
        var links = [];

        _.each(oldElements, function (element) {
            elements.push(this.makeElement(element.get('label')));
        });

        _.each(oldLinks, function (link) {
            links.push(this.makeLink(link.get('source').id, link.get('target').id));
        });

        return elements.concat(links);
    }

    public layoutDiagram(): void {
        var graph = this.diagramEditor.getGraph();
        //var newCells = this.buildGraphFromAdjacencyList(graph.getElements(), graph.getLinks());
        //graph.resetCells(newCells);

        //  { setLinkVertices: false }
        joint.layout.DirectedGraph.layout(graph.getCells());
    }
}