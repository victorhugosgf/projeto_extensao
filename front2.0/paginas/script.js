// Função para adicionar campos de turmas e professores dinamicamente
document.getElementById('num-classes').addEventListener('input', function () {
    const numClasses = parseInt(this.value);
    const classSection = document.getElementById('class-section');
    classSection.innerHTML = ''; // Limpa a seção de turmas

    for (let i = 1; i <= numClasses; i++) {
        const classDiv = document.createElement('div');
        classDiv.classList.add('class-div');
        classDiv.innerHTML = `
            <h3>Turma ${i}</h3>
            <label for="class-${i}-name">Nome da Turma:</label>
            <input type="text" id="class-${i}-name" name="class-${i}-name" required>

            <label for="class-${i}-teachers">Número de Professores:</label>
            <input type="number" id="class-${i}-teachers" name="class-${i}-teachers" required>

            <div id="teachers-${i}"></div>
        `;
        classSection.appendChild(classDiv);

        // Evento para adicionar professores
        const numTeachersInput = classDiv.querySelector(`#class-${i}-teachers`);
        numTeachersInput.addEventListener('input', function () {
            const numTeachers = parseInt(this.value);
            const teachersSection = classDiv.querySelector(`#teachers-${i}`);
            teachersSection.innerHTML = ''; // Limpa a lista de professores

            for (let j = 1; j <= numTeachers; j++) {
                const teacherDiv = document.createElement('div');
                teacherDiv.classList.add('teacher-div');
                teacherDiv.innerHTML = `
                    <h4>Professor ${j}</h4>
                    <label for="teacher-${i}-${j}-name">Nome do Professor:</label>
                    <input type="text" id="teacher-${i}-${j}-name" name="teacher-${i}-${j}-name" required>

                    <div>
                        <label for="teacher-${i}-${j}-segunda">Aulas Disponíveis na Segunda:</label>
                        <input type="text" id="teacher-${i}-${j}-segunda" name="teacher-${i}-${j}-segunda" placeholder="1,3,5">

                        <label for="teacher-${i}-${j}-terca">Aulas Disponíveis na Terça:</label>
                        <input type="text" id="teacher-${i}-${j}-terca" name="teacher-${i}-${j}-terca" placeholder="2,4">

                        <label for="teacher-${i}-${j}-quarta">Aulas Disponíveis na Quarta:</label>
                        <input type="text" id="teacher-${i}-${j}-quarta" name="teacher-${i}-${j}-quarta" placeholder="1,2">

                        <label for="teacher-${i}-${j}-quinta">Aulas Disponíveis na Quinta:</label>
                        <input type="text" id="teacher-${i}-${j}-quinta" name="teacher-${i}-${j}-quinta" placeholder="3,4">

                        <label for="teacher-${i}-${j}-sexta">Aulas Disponíveis na Sexta:</label>
                        <input type="text" id="teacher-${i}-${j}-sexta" name="teacher-${i}-${j}-sexta" placeholder="1,5">
                    </div>
                `;
                teachersSection.appendChild(teacherDiv);
            }
        });
    }
});

// Função para coletar os dados do formulário e enviá-los via POST
document.getElementById('scheduleForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(this);

    // Estrutura do JSON
    const jsonData = {
        horario: [
            formData.get('start-time'),
            formData.get('lesson-duration'),
            formData.get('lessons-before-break'),
            formData.get('break-duration')
        ],
        diasAula: {
            segunda: parseInt(formData.get('segunda-classes') || 0),
            terca: parseInt(formData.get('terca-classes') || 0),
            quarta: parseInt(formData.get('quarta-classes') || 0),
            quinta: parseInt(formData.get('quinta-classes') || 0),
            sexta: parseInt(formData.get('sexta-classes') || 0)
        },
        turmas: []
    };

    // Processar as turmas e professores
    const numClasses = parseInt(formData.get('num-classes'));
    for (let i = 1; i <= numClasses; i++) {
        const turma = {
            nomeTurma: formData.get(`class-${i}-name`),
            professores: []
        };

        const numTeachers = parseInt(formData.get(`class-${i}-teachers`));
        for (let j = 1; j <= numTeachers; j++) {
            const professor = {
                nomeProfessor: formData.get(`teacher-${i}-${j}-name`),
                disponibilidade: {}
            };

            // Adicionar disponibilidade por dia
            ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].forEach((day, index) => {
                const aulas = formData.get(`teacher-${i}-${j}-${day}`);
                if (aulas) {
                    professor.disponibilidade[day] = aulas.split(',').map(aula => parseInt(aula.trim()));
                }
            });

            turma.professores.push(professor);
        }

        jsonData.turmas.push(turma);
    }

    // Enviar os dados para o servidor via POST
    fetch('http://localhost:8080/processar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Resposta do servidor:', data);
        exibirModalComTabelas(data);
    })
    .catch(error => {
        console.error('Erro ao enviar os dados:', error);
        alert('Erro ao enviar o formulário.');
    });
});

/// Função para exibir o modal com as tabelas de cada turma
function exibirModalComTabelas(dados) {
    // Criar o modal
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    // Criar o conteúdo do modal com scroll
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.maxWidth = '80%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto'; // Permite scroll

    // Título do modal
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Tabela de Turmas e Aulas';
    modalContent.appendChild(modalTitle);

    // Processar as turmas
    dados.turmas.forEach(turma => {
        // Criar uma nova tabela para cada turma
        const tabelaTurma = document.createElement('table');
        tabelaTurma.style.width = '100%';
        tabelaTurma.style.borderCollapse = 'collapse';
        tabelaTurma.style.marginBottom = '20px';

        // Cabeçalho da tabela
        const header = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Adicionar a célula da primeira coluna (para as aulas)
        const aulaHeaderCell = document.createElement('th');
        aulaHeaderCell.textContent = 'Aulas';
        aulaHeaderCell.style.border = '1px solid black';
        aulaHeaderCell.style.padding = '8px';
        headerRow.appendChild(aulaHeaderCell);

        // Adicionar células para os dias da semana
        ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].forEach(dia => {
            const th = document.createElement('th');
            th.textContent = dia.charAt(0).toUpperCase() + dia.slice(1); // Primeira letra maiúscula
            th.style.border = '1px solid black';
            th.style.padding = '8px';
            headerRow.appendChild(th);
        });
        
        header.appendChild(headerRow);
        tabelaTurma.appendChild(header);

        // Corpo da tabela
        const tbody = document.createElement('tbody');

        // Encontrar o número máximo de aulas (presumindo que todas as turmas tenham o mesmo número de aulas)
        const maxAulas = Math.max(...Object.values(turma.dias).map(dia => dia.length));

        // Para cada aula (linha)
        for (let i = 0; i < maxAulas; i++) {
            const row = document.createElement('tr');

            // Coluna para a aula (identificador de aula)
            const aulaCell = document.createElement('td');
            aulaCell.textContent = `Aula ${i + 1}`;
            aulaCell.style.border = '1px solid black';
            aulaCell.style.padding = '8px';
            row.appendChild(aulaCell);

            // Para cada dia da semana, adicionar o professor correspondente
            ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].forEach(dia => {
                const cell = document.createElement('td');
                cell.style.border = '1px solid black';
                cell.style.padding = '8px';

                // Verificar se a turma tem professores para esse dia e para essa aula
                if (turma.dias[dia] && turma.dias[dia][i]) {
                    cell.textContent = turma.dias[dia][i];
                } else {
                    cell.textContent = '-'; // Se não houver professor para essa aula
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        }

        tabelaTurma.appendChild(tbody);
        modalContent.appendChild(tabelaTurma);
    });

    // Botão para fechar o modal
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.style.marginTop = '20px';
    closeButton.addEventListener('click', function () {
        modal.remove();
    });
    modalContent.appendChild(closeButton);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}