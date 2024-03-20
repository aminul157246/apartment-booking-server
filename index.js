const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken')
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
        const usersCollection = client.db('apartmentDB').collection('users')


        // user 

        app.get('/users', async(req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            // checking unique email 
            const query = {email : user.email}
            const existingUser = await usersCollection.findOne(query)
            if(existingUser){
                return res.send({message : 'already exist', insertedId : null})
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })

app.patch('/users/admin/:id', async(req, res) => {
    const id = req.params.id
    const filter = { _id: new ObjectId(id) }
    const updatedDoc = {
        $set: {
           role : 'admin'
          },
    }
    const result = await usersCollection.updateOne(filter, updatedDoc)
    res.send(result)
})


        // apartment 
        app.get('/apartments/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }
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

        app.delete('/apartment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await apartmentCollection.deleteOne(query)
            res.send(result)
        })


        // add in DB 


        app.get('/carts', async (req, res) => {
            const email = req.query.email
            console.log(email);
            const query = { "apartmentItem.email": email }
            const result = await cartCollection.find(query).toArray()
            res.send(result);
        })


        app.post('/carts', async (req, res) => {
            const item = req.body
            const result = await cartCollection.insertOne(item)
            res.send(result)
        })

        app.get('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
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


