window.addEventListener('DOMContentLoaded', () => {
    const card_container = document.querySelector('.card-container');
    const card = document.querySelector('.card');

    for (let i = 0; i < 10; ++i) {
        card_container.appendChild(card.cloneNode(true));
    }

    for (let card of card_container.children) {
        content = undefined;
        for (let div of card.children) {
            if (div.className == "content") {
                content = div.innerText;
            }
        }
        if (!content) {
            continue;
        }

        for (let div of card.children) {
            if (div.className == "content" || div.className == "information") {
                div.onclick = () => {
                    navigator.clipboard.writeText(content);
                }
            }
        }
    }
});