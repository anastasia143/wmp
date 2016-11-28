/// <reference path="DiagramEditorController.ts" />
/// <reference path="../model/DiagramScene.ts" />
/// <reference path="../model/DiagramElement.ts" />
/// <reference path="../model/PaletteTypes.ts" />
/// <reference path="../model/DiagramNode.ts" />
/// <reference path="../model/DefaultDiagramNode.ts" />
/// <reference path="../model/commands/Command.ts"/>
/// <reference path="../model/commands/SceneCommandFactory.ts" />
/// <reference path="../../../vendor.d.ts" />
/// <reference path="../../../common/constants/MouseButton.ts" />
var SceneController = (function () {
    function SceneController(diagramEditorController, paper) {
        var _this = this;
        this.contextMenuId = "scene-context-menu";
        this.diagramEditorController = diagramEditorController;
        this.undoRedoController = diagramEditorController.getUndoRedoController();
        this.scene = paper;
        this.paperCommandFactory = new SceneCommandFactory(this);
        this.clickFlag = false;
        this.rightClickFlag = false;
        this.lastCellMouseDownPosition = { x: 0, y: 0 };
        this.scene.on('cell:pointerdown', function (cellView, event, x, y) {
            _this.cellPointerdownListener(cellView, event, x, y);
        });
        this.scene.on('blank:pointerdown', function (event, x, y) {
            _this.blankPoinerdownListener(event, x, y);
        });
        this.scene.on('cell:pointerup', function (cellView, event, x, y) {
            _this.cellPointerupListener(cellView, event, x, y);
        });
        this.scene.on('cell:pointermove', function (cellView, event, x, y) {
            _this.cellPointermoveListener(cellView, event, x, y);
        });
        this.diagramEditorController.getGraph().on('change:position', function (cell) {
            if (!_this.rightClickFlag) {
                return;
            }
            cell.set('position', cell.previous('position'));
        });
        this.initDropPaletteElementListener();
        this.initDeleteListener();
        this.initCustomContextMenu();
        this.initPropertyEditorListener();
        DiagramElementListener.makeAndExecuteCreateLinkCommand = function (linkObject) {
            _this.makeAndExecuteCreateLinkCommand(linkObject);
        };
    }
    SceneController.prototype.getCurrentElement = function () {
        return this.currentElement;
    };
    SceneController.prototype.clearState = function () {
        this.currentElement = null;
        this.clickFlag = false;
        this.rightClickFlag = false;
        this.lastCellMouseDownPosition = { x: 0, y: 0 };
    };
    SceneController.prototype.createLink = function (sourceId, targetId) {
        var link = new joint.dia.Link({
            attrs: {
                '.connection': { stroke: 'black' },
                '.marker-target': { fill: 'black', d: 'M 10 0 L 0 5 L 10 10 z' }
            },
            source: { id: sourceId },
            target: { id: targetId }
        });
        var typeProperties = this.diagramEditorController.getNodeProperties("ControlFlow");
        var linkProperties = {};
        for (var property in typeProperties) {
            linkProperties[property] = new Property(typeProperties[property].name, typeProperties[property].type, typeProperties[property].value);
        }
        var linkObject = new Link(link, linkProperties);
        this.makeAndExecuteCreateLinkCommand(linkObject);
    };
    SceneController.prototype.createNode = function (type, x, y, subprogramId, subprogramName) {
        var image = this.diagramEditorController.getNodeType(type).getImage();
        var name = this.diagramEditorController.getNodeType(type).getName();
        var typeProperties = this.diagramEditorController.getNodeType(type).getPropertiesMap();
        var nodeProperties = {};
        for (var property in typeProperties) {
            nodeProperties[property] = new Property(typeProperties[property].name, typeProperties[property].type, typeProperties[property].value);
        }
        var node;
        if (subprogramId) {
            node = new SubprogramNode(subprogramName, type, x, y, nodeProperties, image, subprogramId);
        }
        else {
            node = new DefaultDiagramNode(name, type, x, y, nodeProperties, image);
        }
        var command = new MultiCommand([this.paperCommandFactory.makeCreateNodeCommand(node),
            this.paperCommandFactory.makeChangeCurrentElementCommand(node, this.currentElement)]);
        this.undoRedoController.addCommand(command);
        command.execute();
    };
    SceneController.prototype.createNodeInEventPositionFromNames = function (names, event) {
        var _this = this;
        var offsetX = (event.pageX - $("#" + this.scene.getId()).offset().left +
            $("#" + this.scene.getId()).scrollLeft()) / this.scene.getZoom();
        var offsetY = (event.pageY - $("#" + this.scene.getId()).offset().top +
            $("#" + this.scene.getId()).scrollTop()) / this.scene.getZoom();
        var gridSize = this.scene.getGridSize();
        offsetX -= offsetX % gridSize;
        offsetY -= offsetY % gridSize;
        var filteredNames = names.filter(function (type) {
            return _this.diagramEditorController.getNodeType(type) !== undefined;
        });
        if (filteredNames.length === 0) {
            return;
        }
        if (filteredNames.length === 1) {
            this.createNode(filteredNames[0], offsetX, offsetY);
            return;
        }
        var items = [];
        for (var i = 0; i < filteredNames.length; ++i) {
            items.push({
                "name": filteredNames[i],
                "action": (function (type, offsetX, offsetY) { _this.createNode(type, offsetX, offsetY); })
                    .bind(this, filteredNames[i], offsetX, offsetY)
            });
        }
        var contextMenu = new ContextMenu();
        var menuDiv = document.createElement("div");
        menuDiv.className = "gestures-menu";
        menuDiv.style.left = event.x + "px";
        menuDiv.style.top = event.y + "px";
        document.body.appendChild(menuDiv);
        contextMenu.showMenu(new CustomEvent("context-menu"), menuDiv, items);
    };
    SceneController.prototype.createLinkBetweenCurrentAndEventTargetElements = function (event) {
        var _this = this;
        var diagramPaper = document.getElementById(this.scene.getId());
        var elementBelow = this.diagramEditorController.getGraph().get('cells').find(function (cell) {
            if (cell instanceof joint.dia.Link)
                return false; // Not interested in links.
            if (cell.id === _this.currentElement.getJointObject().id)
                return false; // The same element as the dropped one.
            var mXBegin = cell.getBBox().origin().x;
            var mYBegin = cell.getBBox().origin().y;
            var mXEnd = cell.getBBox().corner().x;
            var mYEnd = cell.getBBox().corner().y;
            var leftElementPos = (event.pageX - $(diagramPaper).offset().left + $(diagramPaper).scrollLeft()) /
                _this.scene.getZoom();
            var topElementPos = (event.pageY - $(diagramPaper).offset().top + $(diagramPaper).scrollTop()) /
                _this.scene.getZoom();
            return ((mXBegin <= leftElementPos) && (mXEnd >= leftElementPos)
                && (mYBegin <= topElementPos) && (mYEnd >= topElementPos) && (_this.rightClickFlag));
        });
        if (elementBelow) {
            this.createLink(this.currentElement.getJointObject().id, elementBelow.id);
        }
    };
    SceneController.prototype.changeCurrentElement = function (element) {
        if (element !== this.currentElement) {
            var changeCurrentElementCommand = this.paperCommandFactory.makeChangeCurrentElementCommand(element, this.currentElement);
            this.undoRedoController.addCommand(changeCurrentElementCommand);
            changeCurrentElementCommand.execute();
        }
    };
    SceneController.prototype.makeAndExecuteCreateLinkCommand = function (link) {
        var createLinkCommand = this.paperCommandFactory.makeCreateLinkCommand(link);
        this.undoRedoController.addCommand(createLinkCommand);
        createLinkCommand.execute();
    };
    SceneController.prototype.setCurrentElement = function (element) {
        if (this.currentElement) {
            this.unselectElement(this.currentElement.getJointObject());
        }
        this.currentElement = element;
        if (element) {
            this.selectElement(this.currentElement.getJointObject());
            this.diagramEditorController.setNodeProperties(element);
        }
        else {
            this.diagramEditorController.clearNodeProperties();
        }
    };
    SceneController.prototype.addNode = function (node) {
        if (node instanceof SubprogramNode) {
            this.scene.addSubprogramNode(node);
        }
        else {
            this.scene.addNode(node);
        }
    };
    SceneController.prototype.removeElement = function (element) {
        if (element) {
            if (element instanceof DefaultDiagramNode) {
                this.scene.removeNode(element.getJointObject().id);
            }
            else {
                this.scene.removeLink(element.getJointObject().id);
            }
            if (this.currentElement && element === this.currentElement) {
                this.diagramEditorController.clearNodeProperties();
                this.currentElement = null;
            }
        }
    };
    SceneController.prototype.addLink = function (link) {
        this.scene.addLinkToPaper(link);
    };
    SceneController.prototype.blankPoinerdownListener = function (event, x, y) {
        this.changeCurrentElement(null);
    };
    SceneController.prototype.cellPointerdownListener = function (cellView, event, x, y) {
        this.clickFlag = true;
        this.rightClickFlag = false;
        var element = this.scene.getNodeById(cellView.model.id) ||
            this.scene.getLinkById(cellView.model.id);
        this.changeCurrentElement(element);
        if (this.scene.getNodeById(cellView.model.id) && event.button == MouseButton.left) {
            var node = this.scene.getNodeById(cellView.model.id);
            this.lastCellMouseDownPosition.x = node.getX();
            this.lastCellMouseDownPosition.y = node.getY();
        }
        if (event.button == MouseButton.right) {
            this.rightClickFlag = true;
        }
    };
    SceneController.prototype.cellPointerupListener = function (cellView, event, x, y) {
        if (this.clickFlag && event.button == MouseButton.right) {
            $("#" + this.contextMenuId).finish().toggle(100).
                css({
                left: event.pageX - $(document).scrollLeft() + "px",
                top: event.pageY - $(document).scrollTop() + "px"
            });
        }
        else if (event.button == MouseButton.left) {
            var node = this.scene.getNodeById(cellView.model.id);
            if (node) {
                var command = this.paperCommandFactory.makeMoveCommand(node, this.lastCellMouseDownPosition.x, this.lastCellMouseDownPosition.y, node.getX(), node.getY(), this.scene.getZoom());
                this.undoRedoController.addCommand(command);
            }
        }
    };
    SceneController.prototype.cellPointermoveListener = function (cellView, event, x, y) {
        this.clickFlag = false;
    };
    SceneController.prototype.initDropPaletteElementListener = function () {
        var controller = this;
        var paper = this.scene;
        $("#" + this.scene.getId()).droppable({
            drop: function (event, ui) {
                var topElementPos = (ui.offset.top - $(this).offset().top + $(this).scrollTop()) /
                    paper.getZoom();
                var leftElementPos = (ui.offset.left - $(this).offset().left + $(this).scrollLeft()) /
                    paper.getZoom();
                var gridSize = paper.getGridSize();
                topElementPos -= topElementPos % gridSize;
                leftElementPos -= leftElementPos % gridSize;
                var type = $(ui.draggable.context).data("type");
                controller.createNode(type, leftElementPos, topElementPos, $(ui.draggable.context).data("id"), $(ui.draggable.context).data("name"));
            }
        });
    };
    SceneController.prototype.selectElement = function (jointObject) {
        var jQueryEl = this.scene.findViewByModel(jointObject).$el;
        var oldClasses = jQueryEl.attr('class');
        jQueryEl.attr('class', oldClasses + ' selected');
    };
    SceneController.prototype.unselectElement = function (jointObject) {
        $('input:text').blur();
        var jQueryEl = this.scene.findViewByModel(jointObject).$el;
        var removedClass = jQueryEl.attr('class').replace(new RegExp('(\\s|^)selected(\\s|$)', 'g'), '$2');
        jQueryEl.attr('class', removedClass);
    };
    SceneController.prototype.initCustomContextMenu = function () {
        var controller = this;
        $("#diagram-area").bind("contextmenu", function (event) {
            event.preventDefault();
        });
        $("#" + controller.contextMenuId + " li").click(function () {
            switch ($(this).attr("data-action")) {
                case "delete":
                    controller.removeCurrentElement();
                    break;
            }
            $("#" + controller.contextMenuId).hide(100);
        });
    };
    SceneController.prototype.initDeleteListener = function () {
        var _this = this;
        var deleteKey = 46;
        $('html').keyup(function (event) {
            if (event.keyCode == deleteKey) {
                if ($("#" + _this.scene.getId()).is(":visible") && !(document.activeElement.tagName === "INPUT")) {
                    _this.removeCurrentElement();
                }
            }
        });
    };
    SceneController.prototype.removeCurrentElement = function () {
        var _this = this;
        var removeCommands = [];
        removeCommands.push(this.paperCommandFactory.makeChangeCurrentElementCommand(null, this.currentElement));
        if (this.currentElement instanceof DefaultDiagramNode) {
            var node = this.currentElement;
            var connectedLinks = this.scene.getConnectedLinkObjects(node);
            connectedLinks.forEach(function (link) { return removeCommands.push(_this.paperCommandFactory.makeRemoveLinkCommand(link)); });
            removeCommands.push(this.paperCommandFactory.makeRemoveNodeCommand(node));
        }
        else if (this.currentElement instanceof Link) {
            removeCommands.push(this.paperCommandFactory.makeRemoveLinkCommand(this.currentElement));
        }
        var multiCommand = new MultiCommand(removeCommands);
        this.undoRedoController.addCommand(multiCommand);
        multiCommand.execute();
    };
    SceneController.prototype.initPropertyEditorListener = function () {
        var controller = this;
        $(document).on('focus', ".property-edit-element input", function () {
            controller.changeCurrentElement(controller.scene.getNodeById($(this).data("id")));
        });
    };
    return SceneController;
}());
//# sourceMappingURL=SceneController.js.map