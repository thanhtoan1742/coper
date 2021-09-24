'use strict';

const Store = require("electron-store");

function rand(n) {
    return Math.floor(Math.random()*n);
}

class Card {
    constructor(container, id, content="content", copiedCounter=0) {
        this.container = container;
        this.id = id;
        this.name = "card" + this.id;
        this.content = content;
        this.copiedCounter = copiedCounter;

        this.node = document.createElement("li");
        this.node.className = "card";
        this.node.id = this.name;
        
        this.contentNode = this.createContentNode(true);
        this.node.appendChild(this.contentNode);

        this.informationNode = this.createInformationNode();
        this.node.appendChild(this.informationNode);

        this.editApplyButton = this.createEditApplyButton(true);
        this.node.appendChild(this.editApplyButton);

        this.deleteButton = document.createElement("button");
        this.deleteButton.innerText = "delete";
        this.deleteButton.className = "delete";
        this.deleteButton.onclick = () => {
            cardCollection.removeCard(this.id);
        };
        this.node.appendChild(this.deleteButton);

        this.save();
    }

    createContentNode(isNormal=true) {
        let node = undefined;
        if (isNormal) {
            node = document.createElement("div");
            node.onclick = this.copy.bind(this);
        }
        else {
            node = document.createElement("textarea");
            node.addEventListener("input", () => {
                node.style.height = "auto";
                node.style.height = (node.scrollHeight + 10).toString() + "px";
            }, false);
        }

        node.innerHTML = this.content;
        node.className = "content";
        return node;
    }

    createEditApplyButton(isEdit=true) {
        const button = document.createElement("button");
        button.className = "edit-apply";
        if (isEdit) {
            button.innerText = "edit";
            button.onclick = this.changeToEditMode.bind(this);
        }
        else {
            button.innerText = "apply";
            button.onclick = this.changeToNormalMode.bind(this);
        }
        return button;
    }

    createInformationNode() {
        const node = document.createElement("div");
        node.className = "information";
        node.innerHTML = `copied ${this.copiedCounter} time` 
                        + (this.copiedCounter > 1 ? "s" : "");
        node.onclick = this.copy.bind(this);

        return node;
    }

    copy() {
        navigator.clipboard.writeText(this.content).then(
            () => {
                console.log(this.content);
                console.log("copied");
                this.copiedCounter++;
                this.informationNode.innerHTML = `copied ${this.copiedCounter} time` 
                                                + (this.copiedCounter > 1 ? "s" : "");
                this.container.addCopiedCounter(1);

                this.save();
            },
            () => {console.log("copy error");}
        );

        // let [time, _] = Date().toString().split("GMT");
    }

    changeToEditMode() {
        const textArea = this.createContentNode(false);
        this.contentNode.replaceWith(textArea);
        this.contentNode = textArea;

        const applyButton = this.createEditApplyButton(false);
        this.editApplyButton.replaceWith(applyButton);
        this.editApplyButton = applyButton;

        this.contentNode.focus();
    }

    changeToNormalMode() {
        this.content = this.contentNode.value;
        const div = this.createContentNode(true);
        this.contentNode.replaceWith(div);
        this.contentNode = div;

        const editButton = this.createEditApplyButton(true);
        this.editApplyButton.replaceWith(editButton);
        this.editApplyButton = editButton;

        this.save();
    }

    save() {
        this.container.store.set(this.name, this.toJson());
    }

    toJson() {
        return {
            "id": this.id,
            "copiedCounter": this.copiedCounter,
            "content": this.content,
        };
    }
}

class CardCollection {
    constructor() {
        this.store = new Store({name: "coper"});
        this.placeholderCard = new Card(this, -1);
        this.idCounter = this.store.get("idCounter", 0);

        this.node = document.createElement("ul");
        this.node.className = "card-container";

        this.copiedCounter = this.store.get("totalCopiedCounter", 0);
        this.copiedCounterNode = document.createElement("li");
        this.copiedCounterNode.id = "total-copied-counter";
        this.node.appendChild(this.copiedCounterNode);
        this.copiedCounterNode.innerHTML = "copied ??? time totally";

        this.idNotSelected = [];
        this.cards = [];
        this.deletedCards = [];
        this.loadCardArray("cards", this.addCard.bind(this));
        this.loadCardArray("deletedCards", this.addDeletedCard.bind(this));

        this.addCopiedCounter(0);
    }

    loadCardArray(arrayName, addCallback) {
        const cardNames = this.store.get(arrayName, []);
        for (let name of cardNames) {
            const cardJson = this.store.get(name, undefined);
            if (!cardJson)
                continue;

            const card = new Card(this, cardJson.id, cardJson.content, cardJson.copiedCounter);
            addCallback(card);
        }
    }

    addCard(card) {
        this.cards.push(card);
        this.idNotSelected.push(card.id);

        this.node.lastChild.replaceWith(card.node);
        this.node.appendChild(this.copiedCounterNode);

        this.save();
    }

    addDeletedCard(card) {
        this.deletedCards.push(card);
        this.save();
    }

    addCardWithContent(content) {
        if (!content)
            content = this.idCounter.toString();

        const card = new Card(this, this.idCounter++, content);
        this.addCard(card);
    }

    getCard(index = -1) {
        if (index >= this.cards.length || this.cards.length == 0)
            return this.placeholderCard;

        if (index < 0) {
            if (this.idNotSelected.length == 0) {
                for (let card of this.cards)
                    this.idNotSelected.push(card.id);
            }

            const index = rand(this.idNotSelected.length);
            const id = this.idNotSelected[index];
            this.idNotSelected.splice(index, 1);

            for (let card of this.cards)
                if (card.id == id)
                    return card;
        }
        
        return this.cards[index];
    }

    removeCard(id) {
        let index = this.idNotSelected.indexOf(id);
        if (index >= 0)
            this.idNotSelected.splice(index, 1);
        

        index = -1;
        for (let i = 0; i < this.cards.length; ++i) {
            if (this.cards[i].id == id)
                index = i;
        }

        if (index < 0)
            return;

        this.node.removeChild(this.cards[index].node);
        this.deletedCards.push(this.cards[index]);
        this.cards.splice(index, 1);

        this.save();
    }

    addCopiedCounter(n) {
        this.copiedCounter += n;
        this.copiedCounterNode.innerHTML = `copied ${this.copiedCounter} time`
                                        + (this.copiedCounter > 1 ? "s " : " ")
                                        + "totally";
        this.save();
    }

    save() {
        this.store.set("idCounter", this.idCounter);
        this.store.set("totalCopiedCounter", this.copiedCounter);
        
        let names = []
        for (let card of this.cards)
            names.push(card.name);
        this.store.set("cards", names);

        names = []
        for (let card of this.deletedCards)
            names.push(card.name);
        this.store.set("deletedCards", names);
    }

}

const cardCollection = new CardCollection();

window.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(cardCollection.node);

    document.querySelector("#add-card").onclick = () => {
        cardCollection.addCardWithContent("add your content here");
    };
    document.querySelector("#copy-random-card-content").onclick = () => {cardCollection.getCard(-1).copy()};
});