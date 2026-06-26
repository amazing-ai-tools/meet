export type AppLocale = 'pt' | 'en' | 'fr';

export type TranslationKey =
  | 'app.guest'
  | 'app.googleRequired'
  | 'app.loadingMeeting'
  | 'app.productSummary'
  | 'app.signInHint'
  | 'admission.approve'
  | 'admission.approved'
  | 'admission.approveShort'
  | 'admission.denied'
  | 'admission.pendingTitle'
  | 'admission.reject'
  | 'admission.rejected'
  | 'admission.rejectShort'
  | 'admission.waitingBody'
  | 'admission.waitingButton'
  | 'admission.waitingHint'
  | 'admission.waitingTitle'
  | 'background.blur'
  | 'background.brand'
  | 'background.chooseImage'
  | 'background.custom'
  | 'background.noEffect'
  | 'background.notSupported'
  | 'background.turnCameraOn'
  | 'chat.attach'
  | 'chat.blocked'
  | 'chat.empty'
  | 'chat.emptyHint'
  | 'chat.focusTitle'
  | 'chat.focusEyebrow'
  | 'chat.input'
  | 'chat.inputProminent'
  | 'chat.reconnecting'
  | 'chat.removeAttachment'
  | 'chat.send'
  | 'controls.camera'
  | 'controls.chat'
  | 'controls.chatVideoToggle'
  | 'controls.chatUnread'
  | 'controls.devices'
  | 'controls.effects'
  | 'controls.fullscreen'
  | 'controls.host'
  | 'controls.leave'
  | 'controls.link'
  | 'controls.microphone'
  | 'controls.people'
  | 'controls.screen'
  | 'controls.switchCamera'
  | 'controls.video'
  | 'dashboard.createTeam'
  | 'dashboard.instantDescription'
  | 'dashboard.instantTitle'
  | 'dashboard.join'
  | 'dashboard.meetingTitle'
  | 'dashboard.name'
  | 'dashboard.newMeeting'
  | 'dashboard.previewTitle'
  | 'dashboard.room'
  | 'dashboard.roomTitle'
  | 'dashboard.teamName'
  | 'dashboard.teamsDescription'
  | 'dashboard.teamsTitle'
  | 'devices.camera'
  | 'devices.cameraError'
  | 'devices.cameraOff'
  | 'devices.cameraOn'
  | 'devices.description'
  | 'devices.emptyCamera'
  | 'devices.emptyMicrophone'
  | 'devices.emptySpeaker'
  | 'devices.emptySpeakerUnsupported'
  | 'devices.microphone'
  | 'devices.microphoneError'
  | 'devices.microphoneMuted'
  | 'devices.microphoneOn'
  | 'devices.speaker'
  | 'devices.speakerError'
  | 'fullscreen.waitingFriends'
  | 'fullscreen.waitingSelf'
  | 'google.connected'
  | 'google.disabled'
  | 'invite.date'
  | 'invite.emails'
  | 'invite.emptyEmail'
  | 'invite.hostOnly'
  | 'invite.message'
  | 'invite.optional'
  | 'invite.pendingSmtp'
  | 'invite.send'
  | 'invite.sending'
  | 'invite.sent'
  | 'invite.statusFailed'
  | 'invite.statusPending'
  | 'invite.statusSent'
  | 'invite.title'
  | 'invite.titleHostOnly'
  | 'lobby.cameraHint'
  | 'lobby.enter'
  | 'lobby.enterNow'
  | 'lobby.openByLink'
  | 'lobby.persistentRequiresGoogle'
  | 'meeting.connected'
  | 'meeting.connecting'
  | 'meeting.disconnected'
  | 'meeting.interrupted'
  | 'meeting.mediaPermission'
  | 'meeting.panelClose'
  | 'meeting.share'
  | 'meeting.shareRoom'
  | 'moderation.blockChat'
  | 'moderation.blocked'
  | 'moderation.hostHint'
  | 'moderation.hostOnly'
  | 'moderation.micNotPublished'
  | 'moderation.mute'
  | 'moderation.muted'
  | 'moderation.remove'
  | 'moderation.removed'
  | 'moderation.unblockChat'
  | 'moderation.unblocked'
  | 'nav.home'
  | 'nav.meetings'
  | 'nav.rooms'
  | 'nav.teams'
  | 'rooms.allTitle'
  | 'rooms.createDescription'
  | 'rooms.createRoom'
  | 'rooms.createTitle'
  | 'rooms.description'
  | 'rooms.emptyAll'
  | 'rooms.emptySelected'
  | 'rooms.emptyTeams'
  | 'rooms.selectedTeamTitle'
  | 'rooms.title'
  | 'share.copied'
  | 'share.copy'
  | 'stats.hours'
  | 'stats.meetings'
  | 'stats.subtitle'
  | 'stats.teams'
  | 'stats.title'
  | 'stats.users'
  | 'stage.camera'
  | 'stage.choose'
  | 'stage.enlarge'
  | 'stage.noVideo'
  | 'stage.screen'
  | 'stage.self'
  | 'stage.showInChat'
  | 'stage.thumbnail'
  | 'status.fileReadError'
  | 'status.fileTooLarge'
  | 'status.imageOnly'
  | 'status.linkCopied'
  | 'status.you'
  | 'team.addMembers'
  | 'team.inviteAllMembers'
  | 'team.inviteNote'
  | 'team.invitesPending'
  | 'team.invitesSent'
  | 'team.memberEmailsPlaceholder'
  | 'team.membersDescription'
  | 'team.membersSaved'
  | 'team.membersTitle'
  | 'team.noMembers'
  | 'team.noMembersToInvite'
  | 'team.schedule'
  | 'widget.closeVideo'
  | 'widget.contextMissing'
  | 'widget.fullRoom'
  | 'widget.name'
  | 'widget.openFull'
  | 'widget.openVideo'
  | 'widget.powered'
  | 'widget.start'
  | 'widget.subtitle'
  | 'widget.title';

type TranslationMap = Record<TranslationKey, string>;

const pt: TranslationMap = {
  'app.guest': 'Convidado',
  'app.googleRequired': 'Google necessario',
  'app.loadingMeeting': 'Carregando reuniao',
  'app.productSummary': 'Reunioes avulsas por link e salas persistentes para times.',
  'app.signInHint': 'Entre como convidado para reunioes avulsas ou use Google para times.',
  'admission.approve': 'Aprovar entrada',
  'admission.approved': 'Entrada aprovada.',
  'admission.approveShort': 'Aprovar',
  'admission.denied': 'Entrada recusada.',
  'admission.pendingTitle': 'Pedidos de entrada',
  'admission.reject': 'Recusar entrada',
  'admission.rejected': 'Sua entrada foi recusada.',
  'admission.rejectShort': 'Recusar',
  'admission.waitingBody': 'Alguem que ja esta na sala precisa aprovar sua entrada.',
  'admission.waitingButton': 'Aguardando aprovacao',
  'admission.waitingHint': 'Seu pedido foi enviado. A camera e o microfone so ligam depois da aprovacao.',
  'admission.waitingTitle': 'Aguardando aprovacao',
  'background.blur': 'Desfocar fundo',
  'background.brand': 'Fundo amazing-ai',
  'background.chooseImage': 'Escolha uma imagem para o fundo.',
  'background.custom': 'Imagem propria',
  'background.noEffect': 'Sem efeito',
  'background.notSupported': 'Este navegador nao suporta efeitos de fundo.',
  'background.turnCameraOn': 'Ative a camera para aplicar efeitos de fundo.',
  'chat.attach': 'Anexar arquivo',
  'chat.blocked': 'O host bloqueou seu envio no chat.',
  'chat.empty': 'Nenhuma mensagem ainda.',
  'chat.emptyHint': 'Envie texto, imagens ou arquivos para todos na reuniao.',
  'chat.focusEyebrow': 'Chat da reuniao',
  'chat.focusTitle': 'Conversa ao vivo',
  'chat.input': 'Mensagem para a reuniao',
  'chat.inputProminent': 'Escreva uma mensagem para a reuniao...',
  'chat.reconnecting': 'Reconectando ao chat em tempo real...',
  'chat.removeAttachment': 'Remover anexo',
  'chat.send': 'Enviar mensagem',
  'controls.camera': 'Camera',
  'controls.chat': 'Chat',
  'controls.chatVideoToggle': 'Chat / video',
  'controls.chatUnread': 'Chat ({count} novas)',
  'controls.devices': 'Dispositivos',
  'controls.effects': 'Efeitos',
  'controls.fullscreen': 'Tela cheia',
  'controls.host': 'Host',
  'controls.leave': 'Sair',
  'controls.link': 'Link',
  'controls.microphone': 'Microfone',
  'controls.people': 'Pessoas',
  'controls.screen': 'Tela',
  'controls.switchCamera': 'Virar',
  'controls.video': 'Video',
  'dashboard.createTeam': 'Criar time',
  'dashboard.instantDescription': 'Crie um link publico sem login. Quem recebe o link entra pelo lobby com nome ou Google.',
  'dashboard.instantTitle': 'Nova reuniao avulsa',
  'dashboard.join': 'Entrar',
  'dashboard.meetingTitle': 'Titulo da reuniao',
  'dashboard.name': 'Seu nome',
  'dashboard.newMeeting': 'Nova reuniao',
  'dashboard.previewTitle': 'Na sala',
  'dashboard.room': 'Sala',
  'dashboard.roomTitle': 'Sala diaria',
  'dashboard.teamName': 'Nome do time',
  'dashboard.teamsDescription': 'Entre com sua conta Google para criar equipes e adicionar membros por e-mail.',
  'dashboard.teamsTitle': 'Equipes',
  'devices.camera': 'Camera',
  'devices.cameraError': 'Nao foi possivel trocar a camera.',
  'devices.cameraOff': 'Camera desligada',
  'devices.cameraOn': 'Camera ativa',
  'devices.description': 'Escolha camera, microfone e saida de audio sem sair da reuniao. O navegador pode ocultar nomes ate voce permitir camera e microfone.',
  'devices.emptyCamera': 'Nenhuma camera encontrada',
  'devices.emptyMicrophone': 'Nenhum microfone encontrado',
  'devices.emptySpeaker': 'Nenhuma saida encontrada',
  'devices.emptySpeakerUnsupported': 'Seu navegador usa a saida padrao do sistema',
  'devices.microphone': 'Microfone',
  'devices.microphoneError': 'Nao foi possivel trocar o microfone.',
  'devices.microphoneMuted': 'Microfone mutado',
  'devices.microphoneOn': 'Microfone ativo',
  'devices.speaker': 'Saida de audio',
  'devices.speakerError': 'Este navegador nao permitiu trocar a saida de audio.',
  'fullscreen.waitingFriends': 'Aguardando a camera dos seus amigos.',
  'fullscreen.waitingSelf': 'Ative sua camera para se ver em tela cheia.',
  'google.connected': 'Google conectado',
  'google.disabled': 'Google login aguardando configuracao',
  'invite.date': 'Data da agenda',
  'invite.emails': 'E-mails',
  'invite.emptyEmail': 'Informe pelo menos um e-mail.',
  'invite.hostOnly': 'Somente o host pode enviar convites desta sala.',
  'invite.message': 'Mensagem',
  'invite.optional': 'Opcional',
  'invite.pendingSmtp': 'Convites registrados. Configure SMTP para envio automatico por e-mail.',
  'invite.send': 'Enviar convites',
  'invite.sending': 'Enviando...',
  'invite.sent': 'Convites enviados.',
  'invite.statusFailed': 'falhou',
  'invite.statusPending': 'pendente',
  'invite.statusSent': 'enviado',
  'invite.title': 'Enviar convite',
  'invite.titleHostOnly': 'Convites por e-mail',
  'lobby.cameraHint': 'Camera e microfone serao ativados ao entrar na sala LiveKit.',
  'lobby.enter': 'Entrar na reuniao',
  'lobby.enterNow': 'Entrar agora',
  'lobby.openByLink': 'Reuniao avulsa aberta por link.',
  'lobby.persistentRequiresGoogle': 'Esta sala persistente exige Google.',
  'meeting.connected': 'Conectado',
  'meeting.connecting': 'Conectando ao LiveKit...',
  'meeting.disconnected': 'Desconectado',
  'meeting.interrupted': 'Conexao interrompida',
  'meeting.mediaPermission': 'Permita acesso a camera e microfone no navegador para publicar audio e video.',
  'meeting.panelClose': 'Fechar painel',
  'meeting.share': 'Compartilhar reuniao',
  'meeting.shareRoom': 'Compartilhar sala',
  'moderation.blockChat': 'Bloquear chat',
  'moderation.blocked': 'Participante bloqueado no chat.',
  'moderation.hostHint': 'Use o painel Pessoas para mutar microfones, remover participantes e bloquear o chat.',
  'moderation.hostOnly': 'Somente o host pode moderar.',
  'moderation.micNotPublished': 'Participante ainda nao publicou microfone.',
  'moderation.mute': 'Mutar microfone',
  'moderation.muted': 'Microfone do participante mutado.',
  'moderation.remove': 'Remover da reuniao',
  'moderation.removed': 'Participante removido da reuniao.',
  'moderation.unblockChat': 'Liberar chat',
  'moderation.unblocked': 'Participante liberado no chat.',
  'nav.home': 'Ir para inicio',
  'nav.meetings': 'Reunioes',
  'nav.rooms': 'Salas',
  'nav.teams': 'Equipes',
  'rooms.allTitle': 'Todas as salas persistentes',
  'rooms.createDescription': 'Crie uma sala fixa para a equipe selecionada e envie convites para todos os membros quando fizer sentido.',
  'rooms.createRoom': 'Criar sala',
  'rooms.createTitle': 'Nova sala persistente',
  'rooms.description': 'Veja as salas por equipe e as salas persistentes criadas nos seus espacos de trabalho.',
  'rooms.emptyAll': 'Nenhuma sala persistente criada ainda.',
  'rooms.emptySelected': 'Esta equipe ainda nao tem salas persistentes.',
  'rooms.emptyTeams': 'Crie uma equipe antes de adicionar salas persistentes.',
  'rooms.selectedTeamTitle': 'Salas desta equipe',
  'rooms.title': 'Salas persistentes',
  'share.copied': 'Link copiado',
  'share.copy': 'Copiar link',
  'stats.hours': 'horas de reuniao',
  'stats.meetings': 'reunioes criadas',
  'stats.subtitle': 'Numeros persistidos do uso real do amazing-ai meet, somando o tempo de cada participante nas salas.',
  'stats.teams': 'times criados',
  'stats.title': 'Crescimento da comunidade',
  'stats.users': 'usuarios em reunioes',
  'stage.camera': 'Camera',
  'stage.choose': 'Escolher video em destaque',
  'stage.enlarge': 'Ampliar',
  'stage.noVideo': 'Sem video ativo',
  'stage.screen': 'Tela',
  'stage.self': 'Voce',
  'stage.showInChat': 'Mostrar {media} de {participant} no chat',
  'stage.thumbnail': 'Miniatura do video',
  'status.fileReadError': 'Nao foi possivel ler o arquivo.',
  'status.fileTooLarge': 'Arquivos devem ter no maximo 5 MB.',
  'status.imageOnly': 'Escolha uma imagem para o fundo.',
  'status.linkCopied': 'Link copiado',
  'status.you': 'Voce',
  'team.addMembers': 'Adicionar membros',
  'team.inviteAllMembers': 'Enviar convite para todos os membros ao criar a sala',
  'team.inviteNote': 'Voce foi convidado para uma sala do time no amazing-ai meet.',
  'team.invitesPending': 'Convites do time registrados. Configure SMTP para envio automatico.',
  'team.invitesSent': 'Convites enviados para os membros do time.',
  'team.memberEmailsPlaceholder': 'ana@empresa.com, joao@empresa.com',
  'team.membersDescription': 'Adicione e-mails ao time. Eles poderao receber convites das salas persistentes.',
  'team.membersSaved': 'Membros adicionados ao time.',
  'team.membersTitle': 'Membros do time',
  'team.noMembers': 'Nenhum membro por e-mail ainda.',
  'team.noMembersToInvite': 'Sala criada. Adicione membros por e-mail para convidar o time.',
  'team.schedule': 'Data do convite',
  'widget.closeVideo': 'Fechar video',
  'widget.contextMissing': 'Informe contextId na URL do widget.',
  'widget.fullRoom': 'Sala completa',
  'widget.name': 'Seu nome',
  'widget.openFull': 'Abrir no Meet',
  'widget.openVideo': 'Abrir video',
  'widget.powered': 'amazing-ai meet widget',
  'widget.start': 'Entrar no widget',
  'widget.subtitle': 'Chat e video para este contexto.',
  'widget.title': 'Widget de reuniao',
};

const en: TranslationMap = {
  ...pt,
  'app.guest': 'Guest',
  'app.googleRequired': 'Google required',
  'app.loadingMeeting': 'Loading meeting',
  'app.productSummary': 'Instant link meetings and persistent rooms for teams.',
  'app.signInHint': 'Join instant meetings as a guest or use Google for teams.',
  'admission.approve': 'Approve entry',
  'admission.approved': 'Entry approved.',
  'admission.approveShort': 'Approve',
  'admission.denied': 'Entry rejected.',
  'admission.pendingTitle': 'Entry requests',
  'admission.reject': 'Reject entry',
  'admission.rejected': 'Your entry was rejected.',
  'admission.rejectShort': 'Reject',
  'admission.waitingBody': 'Someone already in the room needs to approve your entry.',
  'admission.waitingButton': 'Waiting for approval',
  'admission.waitingHint': 'Your request was sent. Camera and microphone turn on only after approval.',
  'admission.waitingTitle': 'Waiting for approval',
  'background.blur': 'Blur background',
  'background.chooseImage': 'Choose an image for the background.',
  'background.custom': 'Custom image',
  'background.noEffect': 'No effect',
  'background.notSupported': 'This browser does not support background effects.',
  'background.turnCameraOn': 'Turn on your camera to apply background effects.',
  'chat.blocked': 'The host blocked your chat access.',
  'chat.empty': 'No messages yet.',
  'chat.emptyHint': 'Send text, images, or files to everyone in the meeting.',
  'chat.focusEyebrow': 'Meeting chat',
  'chat.focusTitle': 'Live conversation',
  'chat.input': 'Message the meeting',
  'chat.inputProminent': 'Write a message to the meeting...',
  'chat.reconnecting': 'Reconnecting to realtime chat...',
  'chat.send': 'Send message',
  'controls.chatUnread': 'Chat ({count} new)',
  'controls.chatVideoToggle': 'Chat / video',
  'controls.devices': 'Devices',
  'controls.fullscreen': 'Full screen',
  'controls.leave': 'Leave',
  'controls.people': 'People',
  'controls.screen': 'Screen',
  'controls.switchCamera': 'Flip',
  'controls.video': 'Video',
  'dashboard.instantDescription': 'Create a public link without login. Anyone with the link joins from the lobby with a name or Google.',
  'dashboard.instantTitle': 'New instant meeting',
  'dashboard.join': 'Join',
  'dashboard.meetingTitle': 'Meeting title',
  'dashboard.name': 'Your name',
  'dashboard.newMeeting': 'New meeting',
  'dashboard.previewTitle': 'In the room',
  'dashboard.room': 'Room',
  'dashboard.roomTitle': 'Daily room',
  'dashboard.teamName': 'Team name',
  'dashboard.teamsDescription': 'Sign in with your Google account to create teams and add members by email.',
  'dashboard.teamsTitle': 'Teams',
  'devices.cameraError': 'Could not switch camera.',
  'devices.cameraOff': 'Camera off',
  'devices.cameraOn': 'Camera on',
  'devices.description': 'Choose camera, microphone, and audio output without leaving the meeting. The browser may hide names until you allow camera and microphone.',
  'devices.emptyCamera': 'No camera found',
  'devices.emptyMicrophone': 'No microphone found',
  'devices.emptySpeaker': 'No output found',
  'devices.emptySpeakerUnsupported': 'Your browser uses the system default output',
  'devices.microphoneError': 'Could not switch microphone.',
  'devices.microphoneMuted': 'Microphone muted',
  'devices.microphoneOn': 'Microphone on',
  'devices.speaker': 'Audio output',
  'devices.speakerError': 'This browser did not allow changing audio output.',
  'fullscreen.waitingFriends': 'Waiting for your friends camera.',
  'fullscreen.waitingSelf': 'Turn on your camera to see yourself full screen.',
  'google.connected': 'Google connected',
  'google.disabled': 'Google login waiting for configuration',
  'invite.date': 'Calendar date',
  'invite.emptyEmail': 'Enter at least one email.',
  'invite.hostOnly': 'Only the host can send invitations for this room.',
  'invite.message': 'Message',
  'invite.optional': 'Optional',
  'invite.pendingSmtp': 'Invitations recorded. Configure SMTP for automatic email delivery.',
  'invite.send': 'Send invitations',
  'invite.sending': 'Sending...',
  'invite.sent': 'Invitations sent.',
  'invite.statusFailed': 'failed',
  'invite.statusPending': 'pending',
  'invite.statusSent': 'sent',
  'invite.title': 'Send invitation',
  'invite.titleHostOnly': 'Email invitations',
  'lobby.cameraHint': 'Camera and microphone will turn on when you join the LiveKit room.',
  'lobby.enter': 'Join meeting',
  'lobby.enterNow': 'Join now',
  'lobby.openByLink': 'Instant meeting open by link.',
  'lobby.persistentRequiresGoogle': 'This persistent room requires Google.',
  'meeting.connected': 'Connected',
  'meeting.connecting': 'Connecting to LiveKit...',
  'meeting.disconnected': 'Disconnected',
  'meeting.interrupted': 'Connection interrupted',
  'meeting.mediaPermission': 'Allow camera and microphone access in your browser to publish audio and video.',
  'meeting.panelClose': 'Close panel',
  'meeting.share': 'Share meeting',
  'meeting.shareRoom': 'Share room',
  'moderation.blockChat': 'Block chat',
  'moderation.blocked': 'Participant blocked in chat.',
  'moderation.hostHint': 'Use the People panel to mute microphones, remove participants, and block chat.',
  'moderation.hostOnly': 'Only the host can moderate.',
  'moderation.micNotPublished': 'Participant has not published a microphone yet.',
  'moderation.mute': 'Mute microphone',
  'moderation.muted': 'Participant microphone muted.',
  'moderation.remove': 'Remove from meeting',
  'moderation.removed': 'Participant removed from the meeting.',
  'moderation.unblockChat': 'Unblock chat',
  'moderation.unblocked': 'Participant unblocked in chat.',
  'nav.home': 'Go home',
  'nav.meetings': 'Meetings',
  'nav.rooms': 'Rooms',
  'nav.teams': 'Teams',
  'rooms.allTitle': 'All persistent rooms',
  'rooms.createDescription': 'Create a fixed room for the selected team and invite every member when it is useful.',
  'rooms.createRoom': 'Create room',
  'rooms.createTitle': 'New persistent room',
  'rooms.description': 'Browse rooms by team and the persistent rooms created in your workspaces.',
  'rooms.emptyAll': 'No persistent rooms have been created yet.',
  'rooms.emptySelected': 'This team does not have persistent rooms yet.',
  'rooms.emptyTeams': 'Create a team before adding persistent rooms.',
  'rooms.selectedTeamTitle': 'Rooms for this team',
  'rooms.title': 'Persistent rooms',
  'share.copied': 'Link copied',
  'share.copy': 'Copy link',
  'stats.hours': 'meeting hours',
  'stats.meetings': 'meetings created',
  'stats.subtitle': 'Persistent real usage numbers for amazing-ai meet, adding up each participant’s time in rooms.',
  'stats.teams': 'teams created',
  'stats.title': 'Community growth',
  'stats.users': 'users in meetings',
  'status.fileReadError': 'Could not read the file.',
  'status.fileTooLarge': 'Files must be 5 MB or smaller.',
  'status.imageOnly': 'Choose an image for the background.',
  'status.linkCopied': 'Link copied',
  'status.you': 'You',
  'team.addMembers': 'Add members',
  'team.inviteAllMembers': 'Invite all members when creating the room',
  'team.inviteNote': 'You were invited to a team room on amazing-ai meet.',
  'team.invitesPending': 'Team invitations recorded. Configure SMTP for automatic delivery.',
  'team.invitesSent': 'Invitations sent to team members.',
  'team.memberEmailsPlaceholder': 'ana@company.com, joao@company.com',
  'team.membersDescription': 'Add email addresses to the team. They can receive invitations for persistent rooms.',
  'team.membersSaved': 'Members added to the team.',
  'team.membersTitle': 'Team members',
  'team.noMembers': 'No email members yet.',
  'team.noMembersToInvite': 'Room created. Add email members to invite the team.',
  'team.schedule': 'Invitation date',
  'widget.closeVideo': 'Close video',
  'widget.contextMissing': 'Add contextId to the widget URL.',
  'widget.fullRoom': 'Full room',
  'widget.name': 'Your name',
  'widget.openFull': 'Open in Meet',
  'widget.openVideo': 'Open video',
  'widget.powered': 'amazing-ai meet widget',
  'widget.start': 'Enter widget',
  'widget.subtitle': 'Chat and video for this context.',
  'widget.title': 'Meeting widget',
  'stage.choose': 'Choose featured video',
  'stage.enlarge': 'Enlarge',
  'stage.noVideo': 'No active video',
  'stage.self': 'You',
  'stage.showInChat': 'Show {participant} {media} in chat',
  'stage.thumbnail': 'Video thumbnail',
};

const fr: TranslationMap = {
  ...pt,
  'app.guest': 'Invite',
  'app.googleRequired': 'Google requis',
  'app.loadingMeeting': 'Chargement de la reunion',
  'app.productSummary': 'Reunions instantanees par lien et salles persistantes pour les equipes.',
  'app.signInHint': 'Rejoignez les reunions instantanees comme invite ou utilisez Google pour les equipes.',
  'admission.approve': 'Approuver l entree',
  'admission.approved': 'Entree approuvee.',
  'admission.approveShort': 'Approuver',
  'admission.denied': 'Entree refusee.',
  'admission.pendingTitle': 'Demandes d entree',
  'admission.reject': 'Refuser l entree',
  'admission.rejected': 'Votre entree a ete refusee.',
  'admission.rejectShort': 'Refuser',
  'admission.waitingBody': 'Une personne deja dans la salle doit approuver votre entree.',
  'admission.waitingButton': 'En attente d approbation',
  'admission.waitingHint': 'Votre demande a ete envoyee. Camera et micro s activent seulement apres approbation.',
  'admission.waitingTitle': 'En attente d approbation',
  'background.blur': 'Flouter l’arriere-plan',
  'background.chooseImage': 'Choisissez une image pour l’arriere-plan.',
  'background.custom': 'Image personnalisee',
  'background.noEffect': 'Aucun effet',
  'background.notSupported': 'Ce navigateur ne prend pas en charge les effets d’arriere-plan.',
  'background.turnCameraOn': 'Activez la camera pour appliquer les effets d’arriere-plan.',
  'chat.attach': 'Joindre un fichier',
  'chat.blocked': 'L’hote a bloque votre envoi dans le chat.',
  'chat.empty': 'Aucun message pour le moment.',
  'chat.emptyHint': 'Envoyez du texte, des images ou des fichiers a toute la reunion.',
  'chat.focusEyebrow': 'Chat de la reunion',
  'chat.focusTitle': 'Conversation en direct',
  'chat.input': 'Message pour la reunion',
  'chat.inputProminent': 'Ecrivez un message pour la reunion...',
  'chat.reconnecting': 'Reconnexion au chat en temps reel...',
  'chat.removeAttachment': 'Retirer la piece jointe',
  'chat.send': 'Envoyer le message',
  'controls.camera': 'Camera',
  'controls.chatVideoToggle': 'Chat / video',
  'controls.chatUnread': 'Chat ({count} nouveaux)',
  'controls.devices': 'Peripheriques',
  'controls.effects': 'Effets',
  'controls.fullscreen': 'Plein ecran',
  'controls.host': 'Hote',
  'controls.leave': 'Quitter',
  'controls.people': 'Participants',
  'controls.screen': 'Ecran',
  'controls.switchCamera': 'Inverser',
  'controls.video': 'Video',
  'dashboard.createTeam': 'Creer une equipe',
  'dashboard.instantDescription': 'Creez un lien public sans connexion. Toute personne avec le lien rejoint le lobby avec un nom ou Google.',
  'dashboard.instantTitle': 'Nouvelle reunion instantanee',
  'dashboard.join': 'Rejoindre',
  'dashboard.meetingTitle': 'Titre de la reunion',
  'dashboard.name': 'Votre nom',
  'dashboard.newMeeting': 'Nouvelle reunion',
  'dashboard.previewTitle': 'Dans la salle',
  'dashboard.room': 'Salle',
  'dashboard.roomTitle': 'Salle quotidienne',
  'dashboard.teamName': 'Nom de l’equipe',
  'dashboard.teamsDescription': 'Entrez avec votre compte Google pour creer des equipes et ajouter des membres par e-mail.',
  'dashboard.teamsTitle': 'Equipes',
  'devices.cameraError': 'Impossible de changer de camera.',
  'devices.cameraOff': 'Camera desactivee',
  'devices.cameraOn': 'Camera activee',
  'devices.description': 'Choisissez la camera, le microphone et la sortie audio sans quitter la reunion. Le navigateur peut masquer les noms jusqu’a l’autorisation.',
  'devices.emptyCamera': 'Aucune camera trouvee',
  'devices.emptyMicrophone': 'Aucun microphone trouve',
  'devices.emptySpeaker': 'Aucune sortie trouvee',
  'devices.emptySpeakerUnsupported': 'Votre navigateur utilise la sortie par defaut du systeme',
  'devices.microphoneError': 'Impossible de changer de microphone.',
  'devices.microphoneMuted': 'Microphone coupe',
  'devices.microphoneOn': 'Microphone actif',
  'devices.speaker': 'Sortie audio',
  'devices.speakerError': 'Ce navigateur n’a pas autorise le changement de sortie audio.',
  'fullscreen.waitingFriends': 'En attente de la camera de vos amis.',
  'fullscreen.waitingSelf': 'Activez votre camera pour vous voir en plein ecran.',
  'google.connected': 'Google connecte',
  'google.disabled': 'Connexion Google en attente de configuration',
  'invite.date': 'Date d’agenda',
  'invite.emptyEmail': 'Indiquez au moins un e-mail.',
  'invite.hostOnly': 'Seul l’hote peut envoyer des invitations pour cette salle.',
  'invite.message': 'Message',
  'invite.optional': 'Optionnel',
  'invite.pendingSmtp': 'Invitations enregistrees. Configurez SMTP pour l’envoi automatique.',
  'invite.send': 'Envoyer les invitations',
  'invite.sending': 'Envoi...',
  'invite.sent': 'Invitations envoyees.',
  'invite.statusFailed': 'echec',
  'invite.statusPending': 'en attente',
  'invite.statusSent': 'envoye',
  'invite.title': 'Envoyer une invitation',
  'invite.titleHostOnly': 'Invitations par e-mail',
  'lobby.cameraHint': 'La camera et le microphone s’activeront lorsque vous rejoindrez la salle LiveKit.',
  'lobby.enter': 'Rejoindre la reunion',
  'lobby.enterNow': 'Rejoindre maintenant',
  'lobby.openByLink': 'Reunion instantanee ouverte par lien.',
  'lobby.persistentRequiresGoogle': 'Cette salle persistante exige Google.',
  'meeting.connected': 'Connecte',
  'meeting.connecting': 'Connexion a LiveKit...',
  'meeting.disconnected': 'Deconnecte',
  'meeting.interrupted': 'Connexion interrompue',
  'meeting.mediaPermission': 'Autorisez l’acces a la camera et au micro pour publier l’audio et la video.',
  'meeting.panelClose': 'Fermer le panneau',
  'meeting.share': 'Partager la reunion',
  'meeting.shareRoom': 'Partager la salle',
  'moderation.blockChat': 'Bloquer le chat',
  'moderation.blocked': 'Participant bloque dans le chat.',
  'moderation.hostHint': 'Utilisez le panneau Participants pour couper les micros, retirer des participants et bloquer le chat.',
  'moderation.hostOnly': 'Seul l’hote peut moderer.',
  'moderation.micNotPublished': 'Le participant n’a pas encore publie de microphone.',
  'moderation.mute': 'Couper le micro',
  'moderation.muted': 'Microphone du participant coupe.',
  'moderation.remove': 'Retirer de la reunion',
  'moderation.removed': 'Participant retire de la reunion.',
  'moderation.unblockChat': 'Debloquer le chat',
  'moderation.unblocked': 'Participant debloque dans le chat.',
  'nav.home': 'Accueil',
  'nav.meetings': 'Reunions',
  'nav.rooms': 'Salles',
  'nav.teams': 'Equipes',
  'rooms.allTitle': 'Toutes les salles persistantes',
  'rooms.createDescription': 'Creez une salle fixe pour l equipe selectionnee et envoyez des invitations a tous les membres quand c est utile.',
  'rooms.createRoom': 'Creer une salle',
  'rooms.createTitle': 'Nouvelle salle persistante',
  'rooms.description': 'Consultez les salles par equipe et les salles persistantes creees dans vos espaces de travail.',
  'rooms.emptyAll': 'Aucune salle persistante n a encore ete creee.',
  'rooms.emptySelected': 'Cette equipe n a pas encore de salles persistantes.',
  'rooms.emptyTeams': 'Creez une equipe avant d ajouter des salles persistantes.',
  'rooms.selectedTeamTitle': 'Salles de cette equipe',
  'rooms.title': 'Salles persistantes',
  'share.copied': 'Lien copie',
  'share.copy': 'Copier le lien',
  'stats.hours': 'heures de reunion',
  'stats.meetings': 'reunions creees',
  'stats.subtitle': 'Chiffres persistants de l’usage reel de amazing-ai meet, additionnant le temps de chaque participant dans les salles.',
  'stats.teams': 'equipes creees',
  'stats.title': 'Croissance de la communaute',
  'stats.users': 'utilisateurs en reunion',
  'status.fileReadError': 'Impossible de lire le fichier.',
  'status.fileTooLarge': 'Les fichiers doivent faire 5 Mo maximum.',
  'status.imageOnly': 'Choisissez une image pour l’arriere-plan.',
  'status.linkCopied': 'Lien copie',
  'status.you': 'Vous',
  'team.addMembers': 'Ajouter des membres',
  'team.inviteAllMembers': 'Inviter tous les membres lors de la creation de la salle',
  'team.inviteNote': 'Vous avez ete invite dans une salle d’equipe sur amazing-ai meet.',
  'team.invitesPending': 'Invitations de l’equipe enregistrees. Configurez SMTP pour l’envoi automatique.',
  'team.invitesSent': 'Invitations envoyees aux membres de l’equipe.',
  'team.memberEmailsPlaceholder': 'ana@entreprise.com, joao@entreprise.com',
  'team.membersDescription': 'Ajoutez des e-mails a l’equipe. Ils peuvent recevoir les invitations des salles persistantes.',
  'team.membersSaved': 'Membres ajoutes a l’equipe.',
  'team.membersTitle': 'Membres de l’equipe',
  'team.noMembers': 'Aucun membre par e-mail pour le moment.',
  'team.noMembersToInvite': 'Salle creee. Ajoutez des membres par e-mail pour inviter l’equipe.',
  'team.schedule': 'Date d’invitation',
  'widget.closeVideo': 'Fermer la video',
  'widget.contextMissing': 'Ajoutez contextId a l’URL du widget.',
  'widget.fullRoom': 'Salle complete',
  'widget.name': 'Votre nom',
  'widget.openFull': 'Ouvrir dans Meet',
  'widget.openVideo': 'Ouvrir la video',
  'widget.powered': 'widget amazing-ai meet',
  'widget.start': 'Entrer dans le widget',
  'widget.subtitle': 'Chat et video pour ce contexte.',
  'widget.title': 'Widget de reunion',
  'stage.choose': 'Choisir la video en vedette',
  'stage.enlarge': 'Agrandir',
  'stage.noVideo': 'Aucune video active',
  'stage.self': 'Vous',
  'stage.showInChat': 'Afficher {media} de {participant} dans le chat',
  'stage.thumbnail': 'Miniature video',
};

const translations: Record<AppLocale, TranslationMap> = { pt, en, fr };

export function resolveLocale(languages: readonly string[] = []): AppLocale {
  for (const language of languages) {
    const normalized = language.toLowerCase();
    if (normalized.startsWith('en')) {
      return 'en';
    }
    if (normalized.startsWith('fr')) {
      return 'fr';
    }
    if (normalized.startsWith('pt')) {
      return 'pt';
    }
  }

  return 'pt';
}

export function createTranslator(locale: AppLocale) {
  return (key: TranslationKey, values: Record<string, string | number> = {}): string => {
    const template = translations[locale][key] || translations.pt[key] || key;
    return Object.entries(values).reduce(
      (message, [name, value]) => message.split(`{${name}}`).join(String(value)),
      template,
    );
  };
}
