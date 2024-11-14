const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 5000;
const path = require('path')

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'escuela',
});

// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error de conexión: ' + err.stack);
    return;
  }
  console.log('Conectado a la base de datos');
});

// Ruta para generar el archivo con relaciones de un docente
app.get('/api/docentes/:id/relaciones', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT docentes.nombre AS docente_nombre, docentes.apellido AS docente_apellido,
           espacios_curriculares.nombre AS espacio_nombre, espacios_curriculares.curso, espacios_curriculares.division
    FROM docente_espacio
    JOIN docentes ON docente_espacio.docente_id = docentes.id
    JOIN espacios_curriculares ON docente_espacio.espacio_id = espacios_curriculares.id
    WHERE docentes.id = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron relaciones para este docente' });
    }

    const content = results.map(relacion => 
      `Docente: ${relacion.docente_nombre} ${relacion.docente_apellido}\n` +
      `Espacio Curricular: ${relacion.espacio_nombre}\n` +
      `Curso: ${relacion.curso} - División: ${relacion.division}\n\n`
    ).join('');

    const fileName = `relaciones_docente_${id}.txt`;
    const filePath = path.join(__dirname, fileName); // Ruta completa del archivo
    
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al generar el archivo' });
      }
      res.json({ message: 'Archivo generado con éxito', fileUrl: `http://localhost:5000/${fileName}` });
    });
  });
});

// Asegúrate de que el servidor pueda servir archivos estáticos
app.use(express.static(__dirname));

//----------------------------------------------------------------------------------------

// Obtener docentes
app.get('/api/docentes', (req, res) => {
  db.query('SELECT * FROM docentes', (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

// Agregar docente
app.post('/api/docentes', (req, res) => {
  const { nombre, apellido, titulo, especialidad, DNI, telefono, genero, email } = req.body;
  db.query(
    'INSERT INTO docentes ( nombre, apellido, titulo, especialidad, DNI, telefono, genero, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [ nombre, apellido, titulo, especialidad, DNI, telefono, genero, email ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Docente agregado con éxito', id: result.insertId });
    }
  );
});

// Editar docente
app.put('/api/docentes/:id', (req, res) => {
    const { id } = req.params;
    const {  nombre, apellido, titulo, especialidad, DNI, telefono, genero, email } = req.body;
    db.query(
      'UPDATE docentes SET nombre = ?, apellido = ?,titulo = ?,especialidad = ?,DNI = ?,telefono = ?,genero = ?, email = ? WHERE id = ?',
      [nombre, apellido, titulo, especialidad, DNI, telefono, genero, email, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Docente no encontrado' });
        }
        res.json({ message: 'Docente actualizado con éxito' });
      }
    );
  });
  
// Eliminar docente
app.delete('/api/docentes/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM docentes WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Docente eliminado con éxito' });
  });
});

// Obtener espacios curriculares
app.get('/api/espacios', (req, res) => {
  db.query('SELECT * FROM espacios_curriculares', (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

// Agregar espacio curricular
app.post('/api/espacios', (req, res) => {
  const { nombre, curso, division, especialidad, turno, vacante, cargahoraria } = req.body;
  db.query(
    'INSERT INTO espacios_curriculares ( nombre, curso, division, especialidad, turno, vacante, cargahoraria) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [ nombre, curso, division, especialidad, turno, vacante, cargahoraria],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Espacio curricular agregado con éxito', id: result.insertId });
    }
  );
});

  // Editar espacio curricular
  app.put('/api/espacios/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, curso, division, especialidad, turno, vacante, cargahoraria } = req.body;
    db.query(
      'UPDATE espacios_curriculares SET nombre = ?, curso = ?,division = ?, especialidad = ?, turno = ?, vacante = ?, cargahoraria = ? WHERE id = ?',
      [nombre,  curso, division, especialidad, turno, vacante, cargahoraria, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Espacio curricular no encontrado' });
        }
        res.json({ message: 'Espacio curricular actualizado con éxito' });
      }
    );
  });
  

//eliminar espacios curriculares
app.delete('/api/espacios/:id', (req, res) => {
    const { id } = req.params;
  
    db.query('DELETE FROM espacios_curriculares WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error("Error al eliminar espacio curricular: ", err); 
        return res.status(500).json({ error: 'Error al eliminar espacio curricular' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Espacio curricular no encontrado' });
      }
      res.json({ message: 'Espacio curricular eliminado con éxito' });
    });
  });


// Relacionar docente con espacio curricular y actualizar el estado de vacante
app.post('/api/docente_espacio', (req, res) => {
  const { docente_id, espacio_id, fecha } = req.body;
  
  // Iniciar la transacción
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    // Insertar la relación
    db.query(
      'INSERT INTO docente_espacio (docente_id, espacio_id, fecha) VALUES (?, ?, ?)',
      [docente_id, espacio_id, fecha],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: err.message });
          });
        }

        // Actualizar el estado de vacante a "no disponible"
        db.query(
          'UPDATE espacios_curriculares SET vacante = "no disponible" WHERE id = ?',
          [espacio_id],
          (err, result) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }

            // Confirmar la transacción
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
              }
              res.json({ message: 'Relación agregada y vacante actualizada a no disponible' });
            });
          }
        );
      }
    );
  });
});

// Eliminar relación entre docente y espacio curricular y actualizar el estado de vacante
app.delete('/api/docente_espacio/:docente_id/:espacio_id', (req, res) => {
  const { docente_id, espacio_id } = req.params;

  // Iniciar la transacción
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    // Eliminar la relación
    db.query(
      'DELETE FROM docente_espacio WHERE docente_id = ? AND espacio_id = ?',
      [docente_id, espacio_id],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: err.message });
          });
        }
        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: 'Relación no encontrada' });
          });
        }

        // Actualizar el estado de vacante a "disponible"
        db.query(
          'UPDATE espacios_curriculares SET vacante = "disponible" WHERE id = ?',
          [espacio_id],
          (err, result) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }

            // Confirmar la transacción
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
              }
              res.json({ message: 'Relación eliminada y vacante actualizada a disponible' });
            });
          }
        );
      }
    );
  });
});


  // Obtener todas las relaciones entre docentes y espacios curriculares
app.get('/api/docente_espacio', (req, res) => {
    db.query(
      'SELECT docente_espacio.*, docentes.nombre AS docente_nombre, docentes.apellido AS docente_apellido, espacios_curriculares.nombre AS espacio_nombre ' +
      'FROM docente_espacio ' +
      'JOIN docentes ON docente_espacio.docente_id = docentes.id ' +
      'JOIN espacios_curriculares ON docente_espacio.espacio_id = espacios_curriculares.id',
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(result);  
      }
    );
  });

app.listen(port, () => {
  console.log(`Servidor escuchando en puerto ${port}`);
});
