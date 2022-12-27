const express = require('express')
const path = require('path');
const fs = require("fs");
const app = express();

// Server config
app.use(express.json());  // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
app.use(express.static(path.join(__dirname + "/public")))

// For Socket.io config
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


// MIDDLEWARE 
class Contenedor {
    constructor(_nombre) {
        this.nombre = _nombre;
    }

    async save(_content) {
        const existingContent = await this.read()

        if (!existingContent) {
            //CREAR EL ARCHIVO E INSERTAR EL PRIMER ELEMENTO
            try {
                await fs.promises.writeFile(`./${this.nombre}.txt`, JSON.stringify([{
                    id: 1,
                    ..._content,
                }]));
            } catch (err) {
                console.log(err);
            }

        } else {
            //AGREGAR AL CONTENIDO DEL ARCHIVO EXISTENTE
            const existingContentParsed = JSON.parse(existingContent)

            let newItemId = 1;
            if (existingContentParsed.length > 0) { //To prevent insert error after deleteAll
                newItemId = parseInt(existingContentParsed[existingContentParsed.length - 1]['id'] + 1)
            }

            const newContent = [...existingContentParsed, {
                id: parseInt(newItemId),
                ..._content,
            }]
    
            try {
                await fs.promises.writeFile(`./${this.nombre}.txt`, JSON.stringify(newContent))
                return newItemId
            } catch (err) {
                console.log(err);
            }

        }
        
    }

    async read() {
        try {
            const data = await fs.promises.readFile(`./${this.nombre}.txt`, "utf-8");
            return data
        } catch (err) {
            console.log(err)
            return null
        }
    }

    async getById(_id) {
        const existingContent = await this.read()
        if (!existingContent)
            return "El archivo no existe"
        else {
            const existingContentParsed = JSON.parse(existingContent)
            const found = existingContentParsed.find(el => el.id === parseInt(_id));
            if (found) {
                console.log(`Item id: ${_id}:`, found)
                return found
            }
            else {
                console.log(`Item id: ${_id} no fue encontrado`)
                return null
            }
        }
    }

    async getAll() {
        const existingContent = await this.read()
        if (!existingContent)
            return "El archivo no existe"
        else {
            // console.log(JSON.parse(existingContent))
            return JSON.parse(existingContent)
        }
    }

    async update(_id, _content) {
        const existingContent = await this.read();
        if (!existingContent) return "El archivo no existe";
        else {
            const existingContentParsed = JSON.parse(existingContent);
            let found = existingContentParsed.find((el) => el.id === parseInt(_id));
            if (found) {

                const newContent = {
                    id: paserInt(_id),
                    ..._content,
                }

                const index = existingContentParsed.indexOf(found);
                existingContentParsed[index] = newContent;

                try {
                    await fs.promises.writeFile(
                        `./${this.nombre}.txt`,
                        JSON.stringify(existingContentParsed)
                    );
                } catch (err) {
                    console.log(err);
                }
                return paserInt(_id)
            } else {
                console.log(`Item id: ${_id} no fue encontrado`);
                return null;
            }
        }
    }

    async deleteById(_id) {
        const existingContent = await this.read()
        if (!existingContent)
            return "El archivo no existe"
        else {
            //CREAR NUEVO ARRAY, SIN EL ID SELECCIONADO 
            const existingContentParsed = JSON.parse(existingContent)
            const result = existingContentParsed.filter(el => el.id !== parseInt(_id));

            if (result) {       
                try {
                    await fs.promises.writeFile(`./${this.nombre}.txt`, JSON.stringify(result))
                } catch (err) {
                    console.log(err);
                }
                return paserInt(_id)
            }
            else {
                console.log(`Item id: ${_id} no fue encontrado`)
                return null
            }
        }
    }

    async deleteAll() {
        await fs.promises.writeFile(`./${this.nombre}.txt`, JSON.stringify([]))
    }
}
const productos = new Contenedor("productos");
const mensajes = new Contenedor("mensajes");


// ENDPOINTS
app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname})
});


//Socket events
io.on('connection', async (socket) => {
    console.log('Se ha conectado un usuario');
    
    // Se envían todos los productos al usuario
    const productosGet = await productos.getAll();
    socket.emit('productos', productosGet)

    socket.on('nuevoProducto', async data => {
        // Guardar el producto recibido
        await productos.save(data)
        console.log({ success: `Producto ${JSON.stringify(data)} añadido` })

        // Se envían los productos actualizados a los usuarios
        const productosGet = await productos.getAll();
        io.sockets.emit('productos', productosGet)
    })
    
    // Se envían todos los mensajes al usuario
    const mensajesGet = await mensajes.getAll();
    socket.emit('mensajes', mensajesGet)

    socket.on('nuevoMensaje', async data => {
        // Guardar el mensaje recibido
        await mensajes.save({
            ...data,
            hora: new Date().toLocaleString()
        })
        console.log({ success: `Mensaje ${JSON.stringify({
            ...data,
            hora: new Date().toLocaleString()
        })} añadido` })

        // Se envían los mensajes actualizados a los usuarios
        const mensajesGet = await mensajes.getAll();
        io.sockets.emit('mensajes', mensajesGet)
    })
    
    
});

// SERVER INIT
server.listen(8080, () => {
    console.log(`Servidor iniciado en puerto 8080`);
})
// MANEJO DE ERRORES SERVIDOR
server.on("error", (e) => console.log(e))