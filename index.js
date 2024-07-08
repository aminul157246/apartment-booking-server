const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SK);
const port = process.env.PORT || 5001;


const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = 'abc6682aac6e7059'
const store_passwd = 'abc6682aac6e7059@ssl'
const is_live = false


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

        // await client.connect();

        const apartmentCollection = client.db('apartmentDB').collection('apartments')
        const cartCollection = client.db('apartmentDB').collection('cart')
        const usersCollection = client.db('apartmentDB').collection('users')
        const paymentCollection = client.db('apartmentDB').collection('payment')

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





        // payment 

        app.post('/form-data', (req, res) => {

            // const id = req.params.id
            // const query  = { _id : new ObjectId(id)}

            const trans_id = new ObjectId().toString()
            // console.log(trans_id);

            const formInfo = req.body
            console.log(formInfo.totalPrice);


            const data = {
                total_amount: formInfo.totalPrice,
                currency: 'BDT',
                tran_id: trans_id, // use unique tran_id for each api call
                success_url: `http://localhost:5001/payment/success/${trans_id}`,
                fail_url: `http://localhost:5001/payment/failed/${trans_id}`,
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: 'Computer.',
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: formInfo.name,
                cus_email: formInfo.email,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: formInfo.phone,
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            

            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.send({ url: GatewayPageURL })


                const finalPayment = {
                    formInfo, paidStatus: false,
                    transId: trans_id,
                }

                const result = paymentCollection.insertOne(finalPayment)
                // res.send(result)

                console.log('Redirecting to: ', GatewayPageURL)
            });


            app.post('/payment/success/:transId', async (req, res) => {
                console.log('post',req.params.transId);
                const transId = req.params.transId
                const result = await paymentCollection.updateOne(
                    { transId },
                    {
                        $set: {
                            paidStatus: true
                        }
                    })

                if (result.modifiedCount > 0) {
                    res.redirect(`http://localhost:5173/payment/success/${req.params.transId}`)
                }
            })



            // Fetch payment details based on transaction ID
            // app.get('/payment/success/:transId', async (req, res) => {
            //     const transId = req.params.transId;
            //     console.log(" backend get" , transId);
            //     const result = await paymentCollection.findOne({ transId : transId });
            //     res.send(result)

            // });



            app.post('/payment/failed/:transId', async (req, res) => {
                const result = await paymentCollection.deleteOne({ transId: req.params.transId })
                if (result.deletedCount) {
                    res.redirect(`http://localhost:5173/payment/failed/${req.params.transId}`)
                }
            })



            console.log(data);
        })


        app.post('/form-data', async (req, res) => {
            const formData = req.body
            console.log("formData", formData);
            const result = await paymentCollection.insertOne(formData)
            res.send(result)
            console.log(result);
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


