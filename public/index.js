var socket = io();

// PRODUCTOS

socket.on('productos', (data) => {
    const tableContainer = document.querySelector("#table_container");

    if (data.length > 0) {
        let tableHTML = `
        <table style="border: 1px solid black;">
            <tr>
                <th  style="border: 1px solid black; padding: 8px">Nombre</th>
                <th  style="border: 1px solid black; padding: 8px">Precio</th>
                <th style="border: 1px solid black; padding: 8px">URL Imagen</th>
            </tr>
        `
        data.forEach(el => {
            tableHTML += `
            <tr>
                <td style="border: 1px solid black; padding: 8px">${el.title}</td>
                <td style="border: 1px solid black; padding: 8px">${el.price}</td>
                <td style="border: 1px solid black; padding: 8px"><img style="width: 64px; height: auto" src=${el.thumbnail} alt="prod_img"/></td>
            </tr>
            `
        });

        tableContainer.innerHTML = tableHTML + "</table>"
    } else {
        tableContainer.innerHTML = `<p style="color: red; font-size: 20px">Sin productos para mostrar</p>`
    }  
})

const newProductForm = document.getElementById('new_product_form')

new_product_form.onsubmit = (e) => {
    e.preventDefault();

    let data = {};

    [...newProductForm.elements].forEach((item) => {
        if (item.value && item.value !== "")
            data[item.name] = item.value;
    });

    socket.emit('nuevoProducto', data)

}

// MENSAJES

socket.on('mensajes', (data) => {
    const mensajesContainer = document.querySelector("#mensajes_container");

    if (data.length > 0) { //Si existe algún mensaje
        let chatHTML = ``

        data.forEach(el => {
            chatHTML += `
            <p>
            <span style="color: blue; font-weight: 900">${el.email}</span>
            <span style="color: brown;">[${el.hora}]: </span>
            <span style="color: green; font-style: italic;">${el.mensaje}</span>            
            </p>
            `
        });

        mensajesContainer.innerHTML = chatHTML
    } else {
        mensajesContainer.innerHTML = `<p style="color: red; font-size: 20px">Sin mensajes para mostrar</p>`
    }  
})

const newMensajeForm = document.getElementById('mensajes_form')

newMensajeForm.onsubmit = (e) => {
    e.preventDefault();

    let data = {};

    [...newMensajeForm.elements].forEach((item) => {
        if (item.value && item.value !== "")
            data[item.name] = item.value;
    });

    socket.emit('nuevoMensaje', data)

}