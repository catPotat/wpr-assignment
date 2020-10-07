// TODO(you): Write the JavaScript necessary to complete the assignment.

import req from './request.js'
import htmlUtils from './templating.js'

let response = {}


function tgglVis(selectors = []) {
    selectors.forEach(sel => {
        try {
            document.querySelector(sel).classList.toggle('hidden')
        } catch (error) { }
    })
}


document.querySelector('.start-btn').addEventListener("click", () => {
    tgglVis(['.loading-indct', '#introduction'])
    req.post("https://wpr-quiz-api.herokuapp.com/attempts")
        .then(res => {
            tgglVis(['.loading-indct', '.submit-btn-ctn'])
            // conversion
            res.questions.forEach((q, i) => {
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
            // console.log(res)
            htmlUtils.forInTemplating(res)
            response = res
        })
})


document.querySelector('.submit-btn').addEventListener("click", () => {
    if (!confirm("Finish attempt?")) {
        return // hai quay xe
    }
    tgglVis(['.loading-indct', '.submit-btn-ctn'])
    const colected = {}
    document.querySelectorAll('.q__r__radio').forEach(c => {
        if (c.checked) {
            let cId = c.getAttribute("id").split('_')
            colected[cId[0]] = Number(cId[1])
        }
    })
    req.post(`https://wpr-quiz-api.herokuapp.com/attempts/${response._id}/submit`, colected)
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
                    c.setAttribute("disabled", "true")
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


function onRetryBtnClick() {
    htmlUtils.cleanUpMess()
    tgglVis(['#introduction'])
    document.querySelector('.headr').scrollIntoView()
}
