/**
 * session-timeout.js — Expira a sessão do usuário após 15 minutos de inatividade
 * Obs: Depende de modal.js para exibir o aviso antes de deslogar
 */

(function () {
    const TIMEOUT_MIN   = 15;                      // minutos até o logout automático
    const AVISO_MIN     = TIMEOUT_MIN - 1;          // avisa 1 minuto antes
    const TIMEOUT_MS    = TIMEOUT_MIN * 60 * 1000;
    const AVISO_MS      = AVISO_MIN  * 60 * 1000;

    // Eventos que indicam que o usuário está ativo na página
    const EVENTOS_RESET = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    let timerLogout, timerAviso;

    function reiniciarTimers() {
        clearTimeout(timerLogout);
        clearTimeout(timerAviso);

        // Avisa o usuário que a sessão está prestes a expirar
        timerAviso = setTimeout(() => {
            if (typeof mostrarAlerta === 'function') {
                mostrarAlerta(
                    'Sessão quase expirando',
                    'Você será desconectado em 1 minuto por inatividade. Interaja com a página para continuar logado.',
                    'aviso'
                );
            }
        }, AVISO_MS);

        // Redireciona para logout após o tempo total de inatividade
        timerLogout = setTimeout(() => {
            window.location.href = '/logout';
        }, TIMEOUT_MS);
    }

    // Cada interação do usuário reinicia a contagem
    EVENTOS_RESET.forEach(evento => {
        window.addEventListener(evento, reiniciarTimers, { passive: true });
    });

    // Inicia a contagem assim que o script é carregado
    reiniciarTimers();
})();
