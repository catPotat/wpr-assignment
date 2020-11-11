// TODO(you): Write the JavaScript necessary to complete the assignment.

import htmlUtils from './templating.js'

let quiz = {}


function tgglVis(selectors = []) {
    selectors.forEach(sel => {
        try {
            document.querySelector(sel).classList.toggle('hidden')
        } catch (error) { }
    })
}


document.querySelector('.start-btn').addEventListener("click", () => {
    tgglVis(['.loading-indct', '#introduction'])
    fetch(`http://localhost:3000/attempts`, {
        method: 'POST'
    }).then(r => r.json())
        .then(res => {
            tgglVis(['.loading-indct', '.submit-btn-ctn'])
            quiz = res
            // conversion
            quiz.questions.forEach((q, i) => {
                let answers = []
                q.answers.forEach((a, i) => {
                    answers.push({
                        option: a,
                        id: `${q._id}_${i}`,
                    })
                })
                q.answers = answers
                q.index = i + 1
            })
            console.log(quiz)
            htmlUtils.forInTemplating(quiz)
        })
})


document.querySelector('.submit-btn').addEventListener("click", () => {
    if (!confirm("Finish attempt?")) {
        return // hai quay xe
    }
    tgglVis(['.loading-indct', '.submit-btn-ctn'])
    const colected = {answers:{}}
    document.querySelectorAll('.q__r__radio').forEach(c => {
        if (c.checked) {
            let cId = c.getAttribute("id").split('_')
            colected.answers[cId[0]] = cId[1]
        }
    })
    fetch(`http://localhost:3000/attempts/${quiz._id}/submit`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(colected)
    }).then(r => r.json())
        .then(res => {
            tgglVis(['.loading-indct'])
            // console.log(res);
            const data = {
                score: res.score,
                feedback: res.scoreText,
                percentage: res.score / res.questions.length * 100 + '%',
            }
            htmlUtils.doTheTemplating(document.querySelector('#result-scrn'), data)
            document.querySelector('.retry-btn').addEventListener("click", onRetryBtnClick)

            // display correct answers
            let a = res.correctAnswers
            for (const key in a) {
                let toAdd = ""
                document.querySelectorAll(`[id^="${key}"]`).forEach(c => {
                    c.setAttribute("disabled", "")
                    if (c.getAttribute('id').split('_')[1] == a[key]) {
                        toAdd = `correct-${c.checked ? "yes" : "oops"}`
                    } else {
                        toAdd = c.checked ? "wrong" : ""
                    }
                    if (toAdd) {
                        c.parentElement.classList.add(toAdd)
                    }
                })
            }
        })
})


const header = document.querySelector('.headr')
function onRetryBtnClick() {
    htmlUtils.cleanUpMess()
    tgglVis(['#introduction'])
    header.scrollIntoView()
}
