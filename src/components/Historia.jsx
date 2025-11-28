import "./Historia.css";

function Historia() {
  return (
    <section className="historia-section">
      <h2 className="historia-titulo">NUESTRA HISTORIA</h2>

      <div className="historia-bloque">
        <img 
          src="/supabase/img/historia/historia1.png"
          alt="Exterior"
          className="historia-imagen"
        />
        <p>
          Este lugar nació como un sueño sencillo pero lleno de significado. 
          Siempre quise crear un espacio donde las personas pudieran sentirse cómodas, relajadas y bienvenidas desde el primer paso que dieran hacia nuestra cafetería.
          <br /><br />
          Cada rincón fue pensado con cariño, buscando transmitir cercanía, calma y ese ambiente especial que invita a quedarse un rato más.
          Aquí, el tiempo se detiene y todo fluye con suavidad.
        </p>
      </div>

      <div className="historia-bloque">
        <p>
          Al diseñar el interior, imaginé un refugio tranquilo en medio de la rutina diaria. 
          Un lugar donde las conversaciones fluyan, donde se compartan risas, silencios cómodos y momentos que se vuelven recuerdos.
          <br /><br />
          Me inspira ver cómo cada persona se apropia de este espacio, lo hace suyo y lo convierte en una pausa necesaria dentro de su día.
        </p>
        <img 
          src="/supabase/img/historia/historia2.png"
          alt="Interior"
          className="historia-imagen"
        />
      </div>

      <div className="historia-bloque">
        <img 
          src="/supabase/img/historia/historia3.png"
          alt="Mesa"
          className="historia-imagen"
        />
        <p>
          Cada taza que servimos representa dedicación, respeto y amor por lo que hacemos. 
          Detrás de cada preparación hay cuidado en los detalles, paciencia y una profunda conexión con el origen del café.
          <br /><br />
          Trabajamos el café verde con atención y criterio, respetando su proceso natural hasta llevarlo a un punto de tostado preciso donde se fusionan la técnica y la esencia artesanal, dando vida a perfiles auténticos y llenos de carácter.
          Me llena saber que, aunque sea por un momento, formamos parte de las pausas y los pequeños rituales de quienes nos visitan.
        </p>
      </div>
    </section>
  );
}

export default Historia;
