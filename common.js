zip = rows=>rows[0].map((_,c)=>rows.map(row=>row[c]))
// https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function


function toOrderedAns(submittedAnsObj, attmp) {
    // @params { 'qnid1': 3, 'qnid2': 2, ... }, attempt<MongoDoc>
    // converts into ordered answers
    // also discards of invalid question ids
    const orderedQns = attmp.questions
    const orderedAns = attmp.answers
    orderedQns.forEach((qId, i) => {
        orderedAns[i] = submittedAnsObj[qId]
    })
    // console.log(orderedAns);
    return orderedAns
}

module.exports = {
    zip, toOrderedAns
}