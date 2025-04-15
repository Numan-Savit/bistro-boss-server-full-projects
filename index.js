// step-15__________________________________________________________________________________3

const express = require('express');
const app = express();
const cors = require('cors');

require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ymvr3sa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // step-16_________________________________________________________________________________1

    const userCollection = client.db("bistroDb").collection("users");  //step-35_______________1
    const menuCollection = client.db("bistroDb").collection("menu");
    const reviewsCollection = client.db("bistroDb").collection("reviews");  //step-17__________2

    const cartCollection = client.db("bistroDb").collection("carts"); //step-28________________1

    // user related api

    app.get('/users', async(req, res)=>{
        const result = await userCollection.find().toArray();  //step-38_______________________3
        res.send(result);
    })

    //  step-35_________________________________________________________________________________2
    app.post('/users', async(req, res)=>{
        const user = req.body;
        const query = {email: user.email}; //step-37____________________________________________1
        const existingUser = await userCollection.findOne(query); //step-37_____________________2
        if(existingUser){
          return res.send({message: 'user already exists',insertedId: null}) //step-37__________3
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
    })



    app.get('/menu', async(req, res)=>{
        const result = await menuCollection.find().toArray();
        res.send(result);
    })

    // step-16_________________________________________________________________________________1

    // step-17_________________________________________________________________________________1

    app.get('/reviews', async(req, res)=>{
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })

    // step-17_________________________________________________________________________________2

    // step-30_________________________________________________________________________________1
    //  cartCollection-2 shopping cart add api
      
     app.get('/carts', async(req, res)=>{
       const email = req.query.email; //step-31-1
       const query = {email: email};  //step-31-2
       const result = await cartCollection.find(query).toArray();
       res.send(result);
     })

    // step-28_________________________________________________________________________________2

    // cart collection

    app.post('/carts', async(req, res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    })

    // step-28_________________________________________________________________________________2

    // step-34_________________________________________________________________________________2

    app.delete('/carts/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello from Bistro Boss Server!')
})

app.listen(port, () => {
    console.log(`Bistro Boss Server is running on port: ${port}`)
})