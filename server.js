require('dotenv').config()

const express = require('express')
const app = express()
// serve static files (html, css, js, images...)
app.use(express.static('static'))
// decode req.body from post body message
app.use(express.json())



const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const assert = require('assert')

let db = undefined
const uri = `mongodb://${process.env.MONG_USER}:${process.env.MONG_PWD}@${process.env.MONG_HOST}:${process.env.MONG_PORT}/${process.env.MONG_DBNAME}`
MongoClient.connect(uri, { useUnifiedTopology: true }, async (err, client) => {
    assert.strictEqual(null, err)
    db = client.db()
    // console.log("Connected to db")
    await dbInit()
})
// Collections
const Questions = db.collection('questions')
const Atempts = db.collection('attempts')

async function dbInit() {
    // hard code some questions
    // await Questions.insertOne({
    //     _id: ObjectId(),
    //     text: "The correct answer is one",
    //     answers: ['zero','one','two','three'],
    //     trueAns: 1
    // })
    await Questions.deleteOne({ text: 'The correct answer is ' })
    console.log("===============");
    const docs = await Questions.find().map(doc => doc._id).forEach(doc => {
        console.log(doc);
    })
}



app.post('/attempts', async (_req, res) => {
    await Atempts.deleteMany()
    // TODO delete after test
    const randomSet = await Questions.aggregate([{ $sample: { size: 10 } }]).toArray()

    let newAttmp = await Atempts.insertOne({
        _id: ObjectId(),
        questions: randomSet.map(doc => doc._id),
        answers: Array.from({ length: randomSet.length }, () => null),
        startedAt: Date.now(),
        score: 0,
        scoreText: null
    })
    newAttmp = newAttmp.ops[0]

    console.log(newAttmp);

    const result = {
        _id: newAttmp._id,
        questions: randomSet.map(({ trueAns, ...keepAttrs }) => keepAttrs)
    }
    // Improvement 1: No cheating

    res.status(201).json(result)
})


const scoreVerbose = [
    "Practice more to improve it :D",
    "Good, keep up!",
    "Well done!",
    "Perfect!"
]
app.post('/attempts/:id/submit', async (req, res) => {
    const attempId = req.params.id
    const answers = req.body.answers


    const debug = await Atempts.find().toArray()
    console.log(debug[0]);
    console.log("++++++++++++++++++");

    let attmp = await Atempts.findOne({ _id: ObjectId(attempId), scoreText: null })
    if (attmp == null) {
        return res.status(404).end()
    }
    
    const qSet = await Questions.find({ _id: { $in: attmp.questions } }).toArray()

    // score count
    let score = 0
    let level = 0
    for (const ans in answers) {
        // (?.) requires Node >= 14.0.0
        if (answers[ans] == qSet.find(q => q._id == ans)?.trueAns) {
            score += 1
        }
    }
    switch (score) {
        case s => { s < 5 }:
            level = 2
            // TODO fix after testing
            break
        case s => { s < 7 }:
            level = 1
            break
        case s => { s < 9 }:
            level = 2
            break
        case s => { s <= 10 }:
            level = 3
            break
    }
    await Atempts.findOneAndUpdate({_id:ObjectId(attmp._id)}, {
        $set: {
            score: score,
            scoreText: scoreVerbose[level],
        }
    })
    console.log(attmp);
    console.log("------------------");

    const result = {
        _id: attmp._id,
        questions: qSet,
        correctAnswers:
            qSet.reduce((qaPair, q) => {
                qaPair[q._id] = q.trueAns
                return qaPair
            }, {}),
        answers: answers,
        score: score,
        scoreText: attmp.scoreText,
        completed: true
    }

    res.json(result)
})


app.get('/attempts/:id', async (_req, res) => {

    const attmp = await Atempts.findOne({ _id: attempId })
    if (attmp != null) {
        return res.status(404).end()
    }

    const qSet = await Questions.find({ _id: { $in: attmp.questions } }).toArray()
    const result = {
        _id: attmp._id,
        questions: qSet,
        correctAnswers:
            qSet.reduce((qaPair, q) => {
                qaPair[q._id] = q.trueAns
                return qaPair
            }, {}),
        answers: res,
        score: score,
        scoreText: attmp.scoreText,
        completed: true
    }

    res.json(result)
})




app.listen(process.env.EXPRESS_PORT, function () {
    console.log(`Up at ${process.env.BASE_API}:${process.env.EXPRESS_PORT}`)
})