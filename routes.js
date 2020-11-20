const express = require('express')
const router = express.Router()
const ObjectId = require('mongodb').ObjectID

// middleware that is specific to this router
router.use((req, res, next) => {
    console.log('Time: ', Date.now())
    next()
})

router.patch('/attempts/:id', async (req, res) => {
    // Improvement 3
    const attmp = await req.Atempts.findOne({ _id: ObjectId(req.params.id), scoreText: null })
    if (attmp == null) {
        return res.status(404).end()
    }
    const answers = utils.toOrderedAns(req.body.answers, attmp)
    // console.log(answers);
    await req.Atempts.updateOne({ _id: ObjectId(attmp._id) }, {
        $set: { answers: answers }
    }).catch(err => {
        console.error(err)
        return res.status(500).end()
    })
    
    res.json(answers)
})

module.exports = router