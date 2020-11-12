// TODO(you): Write the JavaScript necessary to complete the assignment.

import htmlTmpl from './templating.js'
import utils from './common.js'


let quiz = {}

document.querySelector('.start-btn').addEventListener("click", () => {
    utils.tgglVis(['.loading-indct', '#introduction'])
    // Improvement 2
    const undoneAtt = localStorage.getItem('undoneAtt') || ''
    fetch(`http://localhost:3000/attempts/${undoneAtt}`, {
        method: undoneAtt ? 'GET' : 'POST'
    }).then(r => r.json())
        .then(res => {
            utils.tgglVis(['.loading-indct', '.submit-btn-ctn'])
            quiz = res
            localStorage.setItem('undoneAtt', quiz._id)
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
            htmlTmpl.forInTemplating(quiz)
            // hỏi thầy xem có phải checkbox ko
        })
})


document.querySelector('.submit-btn').addEventListener("click", () => {
    if (!confirm("Finish attempt?")) {
        return // hai quay xe
    }
    utils.tgglVis(['.loading-indct', '.submit-btn-ctn'])
    const collected = utils.collectAns()
    fetch(`http://localhost:3000/attempts/${quiz._id}/submit`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(collected)
    }).then(r => r.json())
        .then(res => {
            localStorage.removeItem('undoneAtt')
            utils.tgglVis(['.loading-indct'])
            // console.log(res);
            const data = {
                score: res.score,
                feedback: res.scoreText,
                percentage: res.score / res.questions.length * 100 + '%',
            }
            htmlTmpl.doTheTemplating(document.querySelector('#result-scrn'), data)
            document.querySelector('.retry-btn').addEventListener("click", onRetryBtnClick)

            // display correct answers
            const a = res.correctAnswers
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
        .finally(() => {
            localStorage.removeItem('undoneAtt')
        })
})


const header = document.querySelector('.headr')
function onRetryBtnClick() {
    htmlTmpl.cleanUpMess()
    utils.tgglVis(['#introduction'])
    header.scrollIntoView()
}



// Improvement 3
const DEBOUNCE = 2000 // milisec
let timeOut
document.querySelector('#attempt-quiz').addEventListener("click", () => {
    clearTimeout(timeOut)
    timeOut = setTimeout(() => {
        const collected = utils.collectAns()
        fetch(`http://localhost:3000/attempts/${quiz._id}`, {
            method: 'PATCH',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(collected)
        }).then(r => r.json())
            .then(res => {
                console.log("Auto saved")
            })
            .catch(err => {})
    }, DEBOUNCE)
})
