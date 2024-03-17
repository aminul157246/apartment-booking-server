const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5001;

//middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6v8amsy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        await client.connect();

        const apartmentCollection = client.db('apartmentDB').collection('apartments')
        const cartCollection = client.db('apartmentDB').collection('cart')


        app.get('/apartments/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id : new ObjectId(id)}
            const result = await apartmentCollection.findOne(query)
            console.log(result);
            res.send(result)
        })


        app.get('/apartment', async (req, res) => {
            const result = await apartmentCollection.find().toArray()
            console.log(result);
            res.send(result)
        })

        app.post('/apartment', async (req, res) => {
            const apartment = req.body
            const result = await apartmentCollection.insertOne(apartment)
            res.send(result)
        })

        app.delete('/apartment/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id : new ObjectId(id)}
            const result = await apartmentCollection.deleteOne(query)
            res.send(result)
        })


        // add in DB 


        app.get('/carts' , async(req, res) => {
            const email = req.params.email
            console.log(email);
            const query = {email : email}
            const result = await cartCollection.find(query).toArray()
            res.send(result)
        })


        app.post('/carts' , async(req, res) => {
            const item = req.body
            const result = await cartCollection.insertOne(item)
            res.send(result)
        })
        

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('CRUD  is running ......!')
})

app.listen(port, () => {
    console.log(`App is  listening on port ${port}`)
})


