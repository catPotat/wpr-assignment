require('dotenv').config()

const express = require('express')
const app = express()
// serve static files (html, css, js, images...)
app.use(express.static('static'))
// decode req.body from form-data
app.use(express.urlencoded())
// decode req.body from post body message
app.use(express.json())



const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const assert = require('assert')

let db = undefined
const uri = `mongodb://${process.env.MONG_USER}:${process.env.MONG_PWD}@${process.env.MONG_HOST}:${process.env.MONG_PORT}/${process.env.MONG_DBNAME}`
MongoClient.connect(uri, async (err, client) => {
    assert.strictEqual(null, err)
    db = client.db()
    // console.log("Connected to db")
    await dbInit()
})

async function dbInit() {
    // hard code some questions

    // await db.collection('questions').insertOne({
    //     _id: ObjectId(),
    //     text: "The correct answer is one",
    //     answers: ['zero','one','two','three'],
    //     trueAns: 1
    // })
    await db.collection('questions').deleteOne({ text: 'The correct answer is ' })
    console.log("===============");
    // .aggregate([{ $sample: { size: 3 } }])
    const docs = await db.collection('questions').aggregate([{ $sample: { size: 5 } }]).map(doc => doc._id).forEach(doc => {
        console.log(doc);
    })
}




app.post('/attemps', async (_req, res) => {
    let newAttmp = undefined
    await db.collection('attemps').deleteMany()
    try {
        const randomSet = await db.collection('questions').aggregate([{ $sample: { size: 5 } }])
        let qaPairArr = await randomSet.toArray()
        qaPairArr = [{id:'a',id:'b'}].reduce((obj,item) => {
            obj['id'] = "aaaaa"
            return obj
          }, {})
        console.log(qaPairArr)
        console.log("=====================");
        newAttmp = await db.collection('attemps').insertOne({
            _id: ObjectId(),
            questions: qaPairArr,
            startedAt: Date.now(),
            score: 0,
            scoreText: undefined,
        })
    } catch (e) {
        console.log(e)
    }

    const docs = await db.collection('attemps').find().toArray()
    console.log(docs)

    res.status(201).json(newAttmp)
})


const perfVerbose = [
    "Practice more to improve it :D",
    "Good, keep up!",
    "Well done!",
    "Perfect!"
]
app.post('/attemps/:id/submit', async (req, res) => {
    const attempId = req.params.id
    const attemptRes = {}

    const doc = await db.collection('words').findOne({ _id: attempId })
    if (doc != null) {
        return res.status(404).end()
    }

    // score count
    let score = 0
    let level = 0
    for (const asw in doc.correctAnswers) {
        if (doc.correctAnswers[asw] == attemptRes[asw]) {
            score += 1
        }
    }
    switch (score) {
        case s => { s < 5 }:
            level = 0
            break
        case s => { 5 <= s && s < 7 }:
            level = 1
            break
        case s => { 7 <= s && s < 9 }:
            level = 2
            break
        case s => { 9 <= s && s <= 10 }:
            level = 3
            break
    }

    const result = await db.collection('words').update({ word: word }, {
        word: word,
        definition: definition
    })
    res.json({ word: definition }) // OK (by default)
})


app.delete('/words/:word', async (req, res) => {
    const word = req.params.word
    const definition = req.body.definition

    const doc = await db.collection('words').findOne({ word: word })
    if (doc != null) {
        return res.status(400).end()
    }

    const result = db.collection('words').deleteOne({ word: word })

    res.status(201).json(result)
})




app.listen(process.env.EXPRESS_PORT, function () {
    console.log(`Up at ${process.env.BASE_API}:${process.env.EXPRESS_PORT}`)
})