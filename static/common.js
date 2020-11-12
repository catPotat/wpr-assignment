
function collectAns() {
    const collected = {answers:{}}
    document.querySelectorAll('.q__r__radio').forEach(c => {
        if (c.checked) {
            let cId = c.getAttribute("id").split('_')
            collected.answers[cId[0]] = cId[1]
        }
    })
    return collected
}

function tgglVis(selectors = []) {
    selectors.forEach(sel => {
        try {
            document.querySelector(sel).classList.toggle('hidden')
        } catch (error) { }
    })
}

export default {
    collectAns, tgglVis
}
