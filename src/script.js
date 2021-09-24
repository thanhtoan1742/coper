'use strict';

function rand(n) {
    return Math.floor(Math.random()*n);
}

class Card {
    constructor(container, content="content") {
        this.content = content;
        this.container = container;
        this.id = this.container.idCounter++;
        this.copied_counter = 0;

        this.node = document.createElement("li");
        this.node.className = "card";
        this.node.id = "card-" + this.id.toString();
        
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
        node.innerText = "never used";
        node.onclick = this.copy.bind(this);

        return node;
    }

    copy() {
        navigator.clipboard.writeText(this.content).then(
            () => {
                console.log(this.content);
                console.log("copied");
                this.copied_counter++;
                this.informationNode.innerHTML = `copied ${this.copied_counter} time` 
                                                + (this.copied_counter > 1 ? "s" : "");
                this.container.addCopiedCounter(1);
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
    }

    changeToNormalMode() {
        this.content = this.contentNode.value;
        const div = this.createContentNode(true);
        this.contentNode.replaceWith(div);
        this.contentNode = div;

        const editButton = this.createEditApplyButton(true);
        this.editApplyButton.replaceWith(editButton);
        this.editApplyButton = editButton;
    }
}

class CardCollection {
    constructor() {
        this.placeholderCard = new Card(this, "placeholder");

        this.cards = [];
        this.idCounter = 0;
        this.deletedCards = [];
        this.idNotSelected = [];
        this.copiedCounter = 0;

        this.node = document.createElement("ul");
        this.node.className = "card-container";

        this.copiedCounterNode = document.createElement("li");
        this.copiedCounterNode.id = "total-copied-counter";
        this.copiedCounterNode.innerHTML = "copied 0 time totally";

        this.node.appendChild(this.copiedCounterNode);
    }

    addCard(content) {
        if (!content)
            content = this.idCounter.toString();

        const card = new Card(this, content);
        this.cards.push(card);
        this.idNotSelected.push(card.id);

        this.node.lastChild.replaceWith(card.node);
        this.node.appendChild(this.copiedCounterNode);
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
    }

    addCopiedCounter(n) {
        this.copiedCounter += n;
        this.copiedCounterNode.innerHTML = `copied ${this.copiedCounter} time`
                                        + (this.copiedCounter > 1 ? "s " : " ")
                                        + "totally";
    }

}

const cardCollection = new CardCollection();

window.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(cardCollection.node);

    document.querySelector("#add-card").onclick = () => {
        cardCollection.addCard("add your content here");
    };
    document.querySelector("#copy-random-card-content").onclick = () => {cardCollection.getCard(-1).copy()};
});