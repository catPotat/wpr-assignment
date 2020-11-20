require('dotenv').config()

const express = require('express')
const app = express()
app.use(express.static('static'))
// decode req.body from post body message
app.use(express.json())

routes = require('./routes')

utils = require('./common')

const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const assert = require('assert')

let db, Questions, Atempts
const uri = `mongodb://${process.env.MONG_USER}:${process.env.MONG_PWD}@${process.env.MONG_HOST}:${process.env.MONG_PORT}/${process.env.MONG_DBNAME}`
MongoClient.connect(uri, { useUnifiedTopology: true }, async (err, client) => {
    assert.strictEqual(null, err)
    db = client.db()
    
    // Collections
    Questions = db.collection('questions')
    Atempts = db.collection('attempts')

    return
    // hard code some questions
    // await Questions.insertOne({
    //     _id: ObjectId(),
    //     text: "The correct answer is three",
    //     answers: ['zero','one','two','three'],
    //     trueAns: 3
    // })
    await Questions.deleteOne({ text: 'The correct answer is ' })
    const docs = await Questions.find().map(doc => doc._id).forEach(doc => {
        console.log(doc);
    })
    console.log("===============");
})



app.post('/attempts', async (_req, res) => {
    // await Atempts.deleteMany()
    // TODO testing purpose
    const randomSet = await Questions.aggregate([
        { $sample: { size: 10 } },
        { $unset: ["trueAns"] }
        // Improvement 1: No cheating
    ]).toArray()

    let newAttmp = await Atempts.insertOne({
        _id: ObjectId(),
        // store question ids in array because
        // objects are not ordered by standard
        // reduces data redundancy
        questions: randomSet.map(doc => doc._id),
        answers: Array.from({ length: randomSet.length }, () => undefined),
        startedAt: new Date(),
        score: 0,
        scoreText: null
    })
    newAttmp = newAttmp.ops[0]

    const result = {
        _id: newAttmp._id,
        questions: randomSet,
        startedAt: newAttmp.startedAt,
    }

    res.status(201).json(result)
})


app.post('/attempts/:id/submit', async (req, res) => {
    const attmp = await Atempts.findOne({ _id: ObjectId(req.params.id), scoreText: null })
    if (attmp == null) {
        return res.status(404).end()
    } 

    // score count
    const qSet = await Questions.find({ _id: { $in: attmp.questions } }).toArray()
    const orderedAns = utils.toOrderedAns(req.body.answers, attmp)
    let score = 0
    let verbose = ""
    attmp.questions.forEach((qId, i) => {
        const ans = orderedAns[i]
        // (?.) requires Node >= 14.0.0
        // deals with data integerity
        if (ans == qSet.find(q => q._id == String(qId))?.trueAns) {
            score += 1
        }
    })
    switch (true) {
        case score < 5:
            verbose = "Practice more to improve it :D"
            break
        case score < 7:
            verbose = "Good, keep up!"
            break
        case score < 9:
            verbose = "Well done!"
            break
        case score <= 10:
            verbose = "Perfect!"
            break
    }
    await Atempts.updateOne({ _id: ObjectId(attmp._id) }, {
        $set: {
            score: score,
            scoreText: verbose,
            answers: orderedAns,
        }
    }).catch(err => {
        console.error(err)
        return res.status(500).end()
    })

    const result = {
        _id: attmp._id,
        questions: qSet,
        correctAnswers:
            qSet.reduce((qaPair, q) => {
                qaPair[q._id] = q.trueAns
                return qaPair
            }, {}),
        answers: req.body.answers,
        score: score,
        scoreText: verbose,
        completed: true
    }

    res.json(result)
})


app.get('/attempts/:id', async (req, res) => {
    // Improvement 2
    const attmp = await Atempts.findOne(
        { _id: ObjectId(req.params.id) }
    )
    if (attmp == null) {
        return res.status(404).end()
    }
    const qnSet = await Questions.find(
        { _id: { $in: attmp.questions } },
        { trueAns: 0 }
    ).toArray()
    
    // re-order questions
    const toOrderedQnSet = ((qnSet, orderedQid) => {
        const orderenQnSet = []
        orderedQid.forEach(qnId => {
            qn = qnSet.find(q => q._id == String(qnId))
            orderenQnSet.push(qn)
        })
        return orderenQnSet
    })

    res.json({
        ...attmp,
        questions: toOrderedQnSet(qnSet, attmp.questions)
    })
})



app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Up at ${process.env.BASE_API}:${process.env.EXPRESS_PORT}`)
    app.use((req, res, next) => {
        req.Atempts = Atempts
        next()
    })
    app.use(routes)
})