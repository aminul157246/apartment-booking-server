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

        // jwt related api 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign({
                user
            }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
            res.send({ token })   //{token : token}
        })

        // verify token - custom middleware
        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers?.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }

            const token = req.headers.authorization.split(' ')[1]
            // console.log(token);
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decode = decode
                next()

            })
        }

        // verify admin with query db email and  decode email 
        // const verifyAdmin = async (req, res, next) => {
        //     const email = req.decode?.user?.email;

        //     console.log('email', req.decode?.user?.email);    // undefined

        //     const query = { email: email }
        //     const user = await usersCollection.findOne(query)
        //     const isAdmin = user?.role === 'admin'
        //     if (!isAdmin) {
        //         return res.status(403).send({ message: 'forbidden access' })

        //     }
        //     next()
        // } 




        // user 
        app.get('/users', verifyToken, async (req, res) => {
            // console.log(req.headers);

            const result = await usersCollection.find().toArray()
            res.send(result)
        })





        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            // console.log(email);

            // if (email !== req.decode?.user?.email) {
            //     return res.status(403).send({ message: 'unauthorized access' })
            // }

            const query = { email: email }
            const user = await usersCollection.findOne(query)
            // console.log(user);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin })


        })









        app.post('/users', async (req, res) => {
            const user = req.body;
            // checking unique email 
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'already exist', insertedId: null })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.delete('/users/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })




        // set admin role 

        app.patch('/users/admin/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                },
            }
            const result = await usersCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })








        // apartment 
        app.get('/apartments/:id', async (req, res) => {
            const id = req.params.id
            // console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await apartmentCollection.findOne(query)
            // console.log(result);
            res.send(result)
        })

        // all apartment get 
        app.get('/apartment', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size)
            console.log(page, size);
            const result = await apartmentCollection.find()
                .skip(page * size)
                .limit(size)
                .toArray()
            // console.log(result);
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

        app.patch('/apartments/:id', async (req, res) => {
            const item = req.body
            console.log(item);
            const id = req.params.id
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    RentPrice: item.RentPrice,
                    RentType: item.RentType,
                    Description: item.Description,
                    ParkingArea: item.ParkingArea,
                    CeilingHeight: item.CeilingHeight,
                    Renovation: item.Renovation,
                    ConstructionYear: item.ConstructionYear,
                    Furnishing: item.Furnishing,
                    AdditionalSpace: item.AdditionalSpace,
                    Bathrooms: item.Bathrooms,
                    Bedrooms: item.Bedrooms,
                    Address: item.Address,
                    AdditionalValue: item.AdditionalValue,
                    ApartmentName: item.ApartmentName,
                    BlockName: item.BlockName,
                    FloorNo: item.FloorNo,
                }
            }
            const result = await apartmentCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // add in DB 


        app.get('/carts', async (req, res) => {
            const email = req.query.email
            // console.log(email);
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
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })




        // dashboard - admin 
        app.get('/admin-status', async (req, res) => {
            const users = await usersCollection.estimatedDocumentCount()
            const apartmentItems = await apartmentCollection.estimatedDocumentCount()
            res.send({ users, apartmentItems })

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


