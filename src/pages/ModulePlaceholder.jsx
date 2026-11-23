
function ModulePlaceholder({ title, group }) {
  return (
    <div className="bg-white rounded-xl shadow p-8">
      <p className="text-blue-600 font-bold">{group}</p>

      <h2 className="text-2xl font-bold mt-2">
        {title}
      </h2>

      <p className="text-gray-500 mt-3">
        Este módulo será integrado à plataforma
        SMART 4.0 após a entrega do grupo responsável.
      </p>

      <div className="mt-6 bg-gray-100 rounded-lg p-5">
        <h3 className="font-semibold">
          Status da integração
        </h3>

        <p className="text-gray-500 text-sm mt-2">
          Aguardando integração com o módulo responsável.
        </p>
      </div>
    </div>
  );
}

export default ModulePlaceholder;
