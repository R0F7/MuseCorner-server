const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

//middleware
app.use(cors(corsOptions))
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wezoknx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const blogCollection = client.db('MuseCornerDB').collection('blog')
        const commentCollection = client.db('MuseCornerDB').collection('comment')
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        app.get('/blog', async (req, res) => {
            const result = await blogCollection.find().sort({ createdAt: -1 }).toArray()
            res.send(result)
        })

        app.get('/all-blogs', async (req, res) => {
            const result = await blogCollection.find().toArray()
            res.send(result)
        })

        app.get('/categories', async (req, res) => {
            const { category } = req.query;
            const result = await blogCollection.find({ category: category }).toArray()
            res.send(result)
        })

        app.get('/search', async (req, res) => {
            const { title } = req.query;
            // console.log(title)
            const result = await blogCollection.find({ title: { $regex: title, $options: 'i' } }).toArray()
            console.log(result)
            res.send(result)
        });

        app.get('/details/:id', async (req, res) => {
            const id = req.params
            const query = { _id: new ObjectId(id) }
            const result = await blogCollection.findOne(query)
            res.send(result)
        })

        app.get('/comments/:id', async (req, res) => {
            const { id } = req.params
            // console.log(id);
            const query = { blogId: id }
            const result = await commentCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/blog', async (req, res) => {
            const info = req.body;
            const result = await blogCollection.insertOne(info)
            res.send(result)
        })

        app.post('/comments', async (req, res) => {
            const info = req.body;
            const result = await commentCollection.insertOne(info)
            res.send(result)
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
    res.send('Alive blog website server')
})

app.listen(port, () => {
    console.log(`Blog Website server run on port:${port}`);
})
