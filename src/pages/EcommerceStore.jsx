
import { useState } from 'react';

const products = [
  {
    id: 1,
    name: 'Peça Industrial A',
    description: 'Componente industrial',
    price: 150
  },
  {
    id: 2,
    name: 'Peça Industrial B',
    description: 'Componente industrial',
    price: 220
  },
  {
    id: 3,
    name: 'Peça Industrial C',
    description: 'Componente industrial',
    price: 180
  }
];

function EcommerceStore() {
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart((current) => [...current, product]);
  }

  const total = cart.reduce(
    (sum, product) => sum + product.price,
    0
  );

  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">
        Loja Industrial
      </h2>

      <p className="text-gray-500 mb-6">
        Escolha os produtos para simular um pedido.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {products.map((product) => (
          <article
            key={product.id}
            className="bg-white p-5 rounded-xl shadow"
          >
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-5xl">
              ⚙️
            </div>

            <h3 className="font-bold mt-4">
              {product.name}
            </h3>

            <p className="text-sm text-gray-500">
              {product.description}
            </p>

            <p className="font-bold text-blue-600 mt-3">
              R$ {product.price.toFixed(2)}
            </p>

            <button
              onClick={() => addToCart(product)}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
            >
              Adicionar ao pedido
            </button>
          </article>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-5 mt-8">
        <h3 className="text-xl font-bold">
          Meu pedido
        </h3>

        <p className="mt-2">
          Produtos adicionados: {cart.length}
        </p>

        <p className="font-bold text-blue-600 mt-2">
          Total: R$ {total.toFixed(2)}
        </p>
      </div>
    </section>
  );
}

export default EcommerceStore;
