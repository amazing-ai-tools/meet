import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Building2,
  CalendarClock,
  Copy,
  LogOut,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Plus,
  QrCode,
  Shield,
  Sparkles,
  SwitchCamera,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import {
  Chat,
  DisconnectButton,
  GridLayout,
  LayoutContextProvider,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useCreateLayoutContext,
  useLocalParticipant,
  useMediaDevices,
  useParticipants,
  useRoomContext,
  useTracks,
  useTrackToggle,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { QRCodeSVG } from 'qrcode.react';

import {
  clearSession,
  createGoogleSession,
  createGuestSession,
  createInstantRoom,
  createTeam,
  createTeamRoom,
  getAppConfig,
  getRoom,
  joinRoom,
  listTeamRooms,
  listTeams,
  loadSession,
} from './api';
import type { JoinResponse, MeetingRoom, Session, Team } from './types';
import { getNextFacingMode, getNextVideoDevice } from './cameraDevices';
import {
  getFullscreenStageToggleLabel,
  toggleFullscreenStageFocus,
  type FullscreenStageFocus,
} from './fullscreenStage';
import { toggleMeetingFullscreen } from './fullscreen';
import { createMeetingUrl } from './meetingLinks';
import { toggleDesktopPanel, type DesktopMeetingPanel } from './desktopMeetingLayout';
import { toggleMobilePanel, type MobileMeetingPanel } from './mobileMeetingLayout';
import './styles.css';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void;
        };
      };
    };
  }
}

const appName = import.meta.env.VITE_APP_NAME || 'amazing-ai meet';
const appDomain = import.meta.env.VITE_APP_DOMAIN || 'meet.app.amazing-ai.tools';
const bugzeroAppKey = import.meta.env.VITE_BUGZERO_APP_KEY || '';
const bugzeroWidgetUrl =
  import.meta.env.VITE_BUGZERO_WIDGET_URL || 'https://bugzero.amazing-ai.tools/widget.js';

function ensureBugZeroWidget() {
  if (!bugzeroAppKey || document.querySelector('script[data-bugzero-widget]')) {
    return;
  }

  const script = document.createElement('script');
  script.src = bugzeroWidgetUrl;
  script.async = true;
  script.dataset.bugzeroWidget = 'true';
  script.dataset.appKey = bugzeroAppKey;
  document.body.appendChild(script);
}

function App() {
  const [session, setSession] = React.useState<Session | undefined>(() => loadSession());
  const [route, setRoute] = React.useState(() => window.location.pathname);
  const [googleClientId, setGoogleClientId] = React.useState(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || '');

  React.useEffect(() => {
    ensureBugZeroWidget();
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  React.useEffect(() => {
    if (googleClientId) {
      return;
    }

    getAppConfig()
      .then((config) => setGoogleClientId(config.googleClientId))
      .catch(() => setGoogleClientId(''));
  }, [googleClientId]);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setRoute(path);
  };

  const logout = () => {
    clearSession();
    setSession(undefined);
  };

  const roomMatch = route.match(/^\/r\/([a-z0-9]+)$/);

  return (
    <main className={roomMatch ? 'product-shell meeting-shell' : 'product-shell'}>
      <Sidebar session={session} onNavigate={navigate} onLogout={logout} />
      {roomMatch ? (
        <MeetingRoute
          slug={roomMatch[1]}
          session={session}
          googleClientId={googleClientId}
          onSession={setSession}
          onNavigate={navigate}
        />
      ) : (
        <Dashboard
          session={session}
          googleClientId={googleClientId}
          onSession={setSession}
          onNavigate={navigate}
        />
      )}
    </main>
  );
}

function Sidebar({
  session,
  onNavigate,
  onLogout,
}: {
  session?: Session;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="side-rail">
      <button className="brand" onClick={() => onNavigate('/')} aria-label="Ir para inicio">
        <span className="brand-mark">M</span>
        <span>{appName}</span>
      </button>

      <nav className="rail-nav" aria-label="Navegacao principal">
        <button onClick={() => onNavigate('/')}>
          <Video size={18} />
          Reunioes
        </button>
        <button onClick={() => onNavigate('/')}>
          <Building2 size={18} />
          Times
        </button>
        <button onClick={() => onNavigate('/')}>
          <CalendarClock size={18} />
          Salas
        </button>
      </nav>

      <div className="identity-box">
        {session ? (
          <>
            <span className="avatar">{session.identity.displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{session.identity.displayName}</strong>
              <small>{session.identity.provider === 'google' ? session.identity.email : 'Convidado'}</small>
            </div>
            <button className="icon-button" onClick={onLogout} aria-label="Sair da sessao">
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <p>Entre como convidado para reunioes avulsas ou use Google para times.</p>
        )}
      </div>
    </aside>
  );
}

function Dashboard({
  session,
  googleClientId,
  onSession,
  onNavigate,
}: {
  session?: Session;
  googleClientId: string;
  onSession: (session: Session) => void;
  onNavigate: (path: string) => void;
}) {
  const [displayName, setDisplayName] = React.useState(session?.identity.displayName || '');
  const [meetingTitle, setMeetingTitle] = React.useState('Nova reuniao amazing-ai meet');
  const [teamName, setTeamName] = React.useState('Produto Amazing');
  const [roomTitle, setRoomTitle] = React.useState('Sala diaria');
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [rooms, setRooms] = React.useState<MeetingRoom[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!session || session.identity.provider !== 'google') {
      setTeams([]);
      setRooms([]);
      return;
    }

    listTeams()
      .then(({ teams: loadedTeams }) => {
        setTeams(loadedTeams);
        const firstTeamId = loadedTeams[0]?.id || '';
        setSelectedTeamId(firstTeamId);
        return firstTeamId ? listTeamRooms(firstTeamId) : Promise.resolve({ rooms: [] });
      })
      .then(({ rooms: loadedRooms }) => setRooms(loadedRooms))
      .catch((err: Error) => setError(err.message));
  }, [session]);

  React.useEffect(() => {
    if (!selectedTeamId) {
      setRooms([]);
      return;
    }

    listTeamRooms(selectedTeamId)
      .then(({ rooms: loadedRooms }) => setRooms(loadedRooms))
      .catch((err: Error) => setError(err.message));
  }, [selectedTeamId]);

  const startInstantMeeting = async () => {
    setBusy(true);
    setError('');
    try {
      let activeSession = session;
      if (!activeSession) {
        activeSession = await createGuestSession(displayName || 'Convidado amazing-ai meet');
        onSession(activeSession);
      }
      const response = await createInstantRoom(meetingTitle, activeSession.identity.displayName);
      if (response.sessionToken) {
        onSession({ identity: response.host, token: response.sessionToken });
      }
      onNavigate(`/r/${response.room.slug}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addTeam = async () => {
    setBusy(true);
    setError('');
    try {
      const { team } = await createTeam(teamName);
      setTeams((current) => [team, ...current]);
      setSelectedTeamId(team.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addTeamRoom = async () => {
    if (!selectedTeamId) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { room } = await createTeamRoom(selectedTeamId, roomTitle);
      setRooms((current) => [room, ...current]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="workspace">
      <header className="topbar">
        <div>
          <h1>{appName}</h1>
          <p>Reunioes avulsas por link e salas persistentes para times.</p>
        </div>
        <GoogleSignIn googleClientId={googleClientId} onSession={onSession} />
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="command-band">
        <div className="command-copy">
          <Sparkles size={22} />
          <div>
            <h2>Nova reuniao avulsa</h2>
            <p>Crie um link publico sem login. Quem recebe o link entra pelo lobby com nome ou Google.</p>
          </div>
        </div>
        <div className="command-form">
          {!session && (
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Seu nome"
              aria-label="Seu nome"
            />
          )}
          <input
            value={meetingTitle}
            onChange={(event) => setMeetingTitle(event.target.value)}
            placeholder="Titulo da reuniao"
            aria-label="Titulo da reuniao"
          />
          <button className="primary-action" onClick={startInstantMeeting} disabled={busy}>
            <Plus size={18} />
            Nova reuniao
          </button>
        </div>
      </section>

      <section className="meeting-preview" aria-label="Preview de reuniao">
        <div className="video-grid-preview">
          {['Ana', 'Bruno', 'Carla', 'Diego'].map((name, index) => (
            <div className="video-tile" key={name}>
              <span>{name.slice(0, 1)}</span>
              <small>{name}</small>
              {index === 0 && <strong>Host</strong>}
            </div>
          ))}
        </div>
        <div className="preview-panel">
          <h2>Na sala</h2>
          <ul>
            <li><Mic size={16} /> Audio e video via LiveKit self-hosted</li>
            <li><MonitorUp size={16} /> Compartilhamento de tela</li>
            <li><Users size={16} /> Participantes e chat da reuniao</li>
            <li><Shield size={16} /> Host pode moderar participantes</li>
          </ul>
        </div>
      </section>

      <section className="teams-section">
        <div className="section-head">
          <div>
            <h2>Times e salas persistentes</h2>
            <p>Use Google para criar workspaces e manter salas fixas por time.</p>
          </div>
          {session?.identity.provider !== 'google' && <span className="login-required">Google necessario</span>}
        </div>

        <div className="team-builder">
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Nome do time"
            disabled={session?.identity.provider !== 'google'}
          />
          <button onClick={addTeam} disabled={busy || session?.identity.provider !== 'google'}>
            <UserPlus size={17} />
            Criar time
          </button>
        </div>

        {teams.length > 0 && (
          <div className="team-board">
            <div className="team-list">
              {teams.map((team) => (
                <button
                  className={team.id === selectedTeamId ? 'selected' : ''}
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <Building2 size={17} />
                  {team.name}
                </button>
              ))}
            </div>
            <div className="room-list">
              <div className="team-builder compact">
                <input value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} />
                <button onClick={addTeamRoom} disabled={busy}>
                  <Plus size={16} />
                  Sala
                </button>
              </div>
              {rooms.map((room) => (
                <article key={room.id}>
                  <div>
                    <h3>{room.title}</h3>
                    <p>Link persistente: /r/{room.slug}</p>
                  </div>
                  <button onClick={() => onNavigate(`/r/${room.slug}`)}>Entrar</button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

function GoogleSignIn({
  googleClientId,
  onSession,
}: {
  googleClientId: string;
  onSession: (session: Session) => void;
}) {
  const buttonRef = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    if (!googleClientId || !buttonRef.current) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          try {
            const session = await createGoogleSession(credential);
            onSession(session);
            setStatus('Google conectado');
          } catch (err) {
            setStatus((err as Error).message);
          }
        },
      });
      window.google?.accounts.id.renderButton(buttonRef.current!, {
        theme: 'outline',
        size: 'large',
        width: 220,
      });
    };
    document.head.appendChild(script);
  }, [googleClientId, onSession]);

  if (!googleClientId) {
    return <span className="google-disabled">Google login aguardando configuracao</span>;
  }

  return (
    <div className="google-box">
      <div ref={buttonRef} />
      {status && <small>{status}</small>}
    </div>
  );
}

function MeetingRoute({
  slug,
  session,
  googleClientId,
  onSession,
  onNavigate,
}: {
  slug: string;
  session?: Session;
  googleClientId: string;
  onSession: (session: Session) => void;
  onNavigate: (path: string) => void;
}) {
  const [room, setRoom] = React.useState<MeetingRoom | undefined>();
  const [displayName, setDisplayName] = React.useState(session?.identity.displayName || '');
  const [join, setJoin] = React.useState<JoinResponse | undefined>();
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const meetingUrl = createMeetingUrl(slug, appDomain);

  React.useEffect(() => {
    setJoin(undefined);
    getRoom(slug)
      .then(({ room: loadedRoom }) => setRoom(loadedRoom))
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  const enterRoom = async () => {
    setBusy(true);
    setError('');
    try {
      let activeSession = session;
      if (!activeSession && displayName.trim()) {
        activeSession = await createGuestSession(displayName);
        onSession(activeSession);
      }
      const response = await joinRoom(slug, activeSession?.identity.displayName || displayName);
      if (response.sessionToken) {
        onSession({ identity: response.identity, token: response.sessionToken });
      }
      setJoin(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (join) {
    return <MeetingRoomView join={join} meetingUrl={meetingUrl} onNavigate={onNavigate} />;
  }

  return (
    <section className="workspace lobby">
      <header className="topbar">
        <div>
          <h1>{room?.title || 'Carregando reuniao'}</h1>
          <p>{room?.requiresLogin ? 'Esta sala persistente exige Google.' : 'Reuniao avulsa aberta por link.'}</p>
        </div>
        <CopyLinkButton url={meetingUrl} />
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="lobby-card">
        <div className="camera-check">
          <Video size={46} />
          <p>Camera e microfone serao ativados ao entrar na sala LiveKit.</p>
        </div>
        <div className="lobby-form">
          <h2>Entrar na reuniao</h2>
          {!session && (
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Seu nome"
              aria-label="Seu nome para entrar"
            />
          )}
          <GoogleSignIn googleClientId={googleClientId} onSession={onSession} />
          <button className="primary-action" onClick={enterRoom} disabled={busy || (!session && displayName.trim().length < 2)}>
            <Video size={18} />
            Entrar agora
          </button>
          <MeetingShareCard url={meetingUrl} label="Compartilhar sala" />
        </div>
      </div>
    </section>
  );
}

function MeetingRoomView({
  join,
  meetingUrl,
  onNavigate,
}: {
  join: JoinResponse;
  meetingUrl: string;
  onNavigate: (path: string) => void;
}) {
  const isHost = join.participant.role === 'host';
  const [connectionStatus, setConnectionStatus] = React.useState('Conectando ao LiveKit...');
  const [roomError, setRoomError] = React.useState<string | undefined>();

  const handleRoomError = React.useCallback((error: Error) => {
    setConnectionStatus('Conexao interrompida');
    setRoomError(error.message || 'Nao foi possivel conectar audio e video.');
  }, []);

  const handleMediaDeviceFailure = React.useCallback(() => {
    setRoomError('Permita acesso a camera e microfone no navegador para publicar audio e video.');
  }, []);

  return (
    <section className="meeting-stage">
      <header className="meeting-header">
        <div>
          <h1>{join.room.title}</h1>
          <p>/{join.room.slug} · {join.identity.displayName} · {connectionStatus}</p>
        </div>
        <div className="meeting-actions">
          <CopyLinkButton url={meetingUrl} />
          <button className="leave-button" onClick={() => onNavigate('/')}>
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </header>

      {roomError ? (
        <div className="meeting-alert" role="alert">
          {roomError}
        </div>
      ) : null}

      <LiveKitRoom
        token={join.livekit.token}
        serverUrl={join.livekit.url}
        connect
        video
        audio
        className="livekit-shell"
        data-lk-theme="default"
        onConnected={() => {
          setConnectionStatus('Conectado');
          setRoomError(undefined);
        }}
        onDisconnected={() => setConnectionStatus('Desconectado')}
        onError={handleRoomError}
        onMediaDeviceFailure={handleMediaDeviceFailure}
      >
        <MeetingExperience meetingUrl={meetingUrl} isHost={isHost} onDeviceError={handleMediaDeviceFailure} />
      </LiveKitRoom>
    </section>
  );
}

function MeetingExperience({
  meetingUrl,
  isHost,
  onDeviceError,
}: {
  meetingUrl: string;
  isHost: boolean;
  onDeviceError: () => void;
}) {
  const layoutContext = useCreateLayoutContext();
  const stageRef = React.useRef<HTMLDivElement>(null);
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const participants = useParticipants();
  const [mobilePanel, setMobilePanel] = React.useState<MobileMeetingPanel>(null);
  const [desktopPanel, setDesktopPanel] = React.useState<DesktopMeetingPanel>(null);
  const [fullscreenActive, setFullscreenActive] = React.useState(false);
  const [fullscreenFocus, setFullscreenFocus] = React.useState<FullscreenStageFocus>('friends');

  React.useEffect(() => {
    const updateFullscreenState = () => {
      const fullscreenDocument = document as Document & { webkitFullscreenElement?: Element | null };
      const isActive = Boolean(fullscreenDocument.fullscreenElement || fullscreenDocument.webkitFullscreenElement);
      setFullscreenActive(isActive);
      if (!isActive) {
        setFullscreenFocus('friends');
      }
    };
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
    };
  }, []);

  const togglePanel = (panel: Exclude<MobileMeetingPanel, null>) => {
    setMobilePanel((current) => toggleMobilePanel(current, panel));
  };
  const toggleDesktopSidePanel = (panel: Exclude<DesktopMeetingPanel, null>) => {
    setDesktopPanel((current) => toggleDesktopPanel(current, panel));
  };
  const closeDesktopSidePanel = () => {
    setDesktopPanel(null);
  };
  const toggleFullscreen = async () => {
    const element = stageRef.current || document.documentElement;
    const entered = await toggleMeetingFullscreen(element);
    setFullscreenActive(entered);
  };
  const toggleStageFocus = () => {
    setFullscreenFocus((current) => toggleFullscreenStageFocus(current));
  };

  return (
    <LayoutContextProvider value={layoutContext}>
      <div
        className={
          fullscreenActive
            ? `meeting-livekit-layout is-fullscreen is-stage-${fullscreenFocus}`
            : 'meeting-livekit-layout'
        }
        ref={stageRef}
      >
        <div className="meeting-video-panel">
          <RoomAudioRenderer />
          <MeetingVideoStage tracks={tracks} fullscreenActive={fullscreenActive} fullscreenFocus={fullscreenFocus} />
          <MeetingCallControls
            activeDesktopPanel={desktopPanel}
            fullscreenActive={fullscreenActive}
            fullscreenFocus={fullscreenFocus}
            isHost={isHost}
            onDeviceError={onDeviceError}
            onToggleDesktopPanel={toggleDesktopSidePanel}
            onToggleFullscreen={toggleFullscreen}
            onToggleStageFocus={toggleStageFocus}
            participantCount={participants.length}
          />
          <div className="mobile-meeting-tabs" aria-label="Abrir painel da reuniao">
            <button
              type="button"
              className={mobilePanel === 'participants' ? 'active' : ''}
              aria-expanded={mobilePanel === 'participants'}
              onClick={() => togglePanel('participants')}
            >
              <Users size={16} />
              Pessoas
            </button>
            <button
              type="button"
              className={mobilePanel === 'chat' ? 'active' : ''}
              aria-expanded={mobilePanel === 'chat'}
              onClick={() => togglePanel('chat')}
            >
              <MessageSquare size={16} />
              Chat
            </button>
            <button
              type="button"
              className={mobilePanel === 'share' ? 'active' : ''}
              aria-expanded={mobilePanel === 'share'}
              onClick={() => togglePanel('share')}
            >
              <QrCode size={16} />
              Link
            </button>
          </div>
        </div>

        <div
          className={[
            'meeting-side-panel',
            desktopPanel ? `is-desktop-open is-${desktopPanel}-open` : '',
            mobilePanel ? `is-${mobilePanel}-open` : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <section className="participants-panel" aria-label="Participantes da reuniao">
            <div className="panel-title-row">
              <h2>Participantes</h2>
              <span>{participants.length}</span>
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label="Fechar painel">
                <X size={16} />
              </button>
            </div>
            <ul>
              {participants.map((participant) => (
                <li key={participant.identity}>
                  <span className="participant-dot" />
                  <span>{participant.name || participant.identity}</span>
                  {participant.isLocal ? <small>Voce</small> : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="chat-panel" aria-label="Chat da reuniao">
            <div className="panel-title-row">
              <h2>Chat</h2>
              <span>ao vivo</span>
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label="Fechar painel">
                <X size={16} />
              </button>
            </div>
            <Chat />
          </section>

          <section className="share-panel" aria-label="Compartilhar reuniao">
            <div className="panel-title-row share-title-row">
              <h2>Link da reuniao</h2>
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label="Fechar painel">
                <X size={16} />
              </button>
            </div>
            <MeetingShareCard url={meetingUrl} label="Compartilhar reuniao" compact />
          </section>

          <section className="host-tools-panel" aria-label="Controles de host">
            <div className="panel-title-row">
              <h2>Host</h2>
              <Shield size={16} />
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label="Fechar painel">
                <X size={16} />
              </button>
            </div>
            <p>{isHost ? 'Voce pode moderar participantes desta sala.' : 'Somente o host pode moderar.'}</p>
            <button disabled={!isHost}>
              <Mic size={16} />
              Mutar participante
            </button>
            <button disabled={!isHost}>
              <LogOut size={16} />
              Remover participante
            </button>
          </section>
        </div>
      </div>
    </LayoutContextProvider>
  );
}

type MeetingTrack = ReturnType<typeof useTracks>[number];

function MeetingVideoStage({
  tracks,
  fullscreenActive,
  fullscreenFocus,
}: {
  tracks: MeetingTrack[];
  fullscreenActive: boolean;
  fullscreenFocus: FullscreenStageFocus;
}) {
  if (!fullscreenActive) {
    return (
      <GridLayout tracks={tracks} className="meeting-video-grid">
        <ParticipantTile />
      </GridLayout>
    );
  }

  const localCameraTrack =
    tracks.find((track) => track.participant.isLocal && track.source === Track.Source.Camera) ||
    tracks.find((track) => track.participant.isLocal);
  const friendTracks = tracks.filter((track) => !track.participant.isLocal);
  const selfTracks = localCameraTrack ? [localCameraTrack] : [];
  const primaryTracks = fullscreenFocus === 'self' ? selfTracks : friendTracks;

  return (
    <div className="fullscreen-stage" aria-label="Video em tela cheia">
      <div className={primaryTracks.length > 1 ? 'fullscreen-stage-grid' : 'fullscreen-stage-grid single'}>
        {primaryTracks.length > 0 ? (
          primaryTracks.map((track) => (
            <ParticipantTile
              key={`${track.participant.identity}-${track.source}`}
              trackRef={track}
              className="fullscreen-stage-tile"
            />
          ))
        ) : (
          <div className="fullscreen-stage-empty">
            {fullscreenFocus === 'friends'
              ? 'Aguardando a camera dos seus amigos.'
              : 'Ative sua camera para se ver em tela cheia.'}
          </div>
        )}
      </div>

      {fullscreenFocus === 'friends' && localCameraTrack ? (
        <aside className="local-camera-preview" aria-label="Sua camera">
          <ParticipantTile trackRef={localCameraTrack} className="local-camera-preview-tile" />
          <span>Voce</span>
        </aside>
      ) : null}
    </div>
  );
}

function MeetingCallControls({
  activeDesktopPanel,
  fullscreenActive,
  fullscreenFocus,
  isHost,
  onDeviceError,
  onToggleDesktopPanel,
  onToggleFullscreen,
  onToggleStageFocus,
  participantCount,
}: {
  activeDesktopPanel: DesktopMeetingPanel;
  fullscreenActive: boolean;
  fullscreenFocus: FullscreenStageFocus;
  isHost: boolean;
  onDeviceError: () => void;
  onToggleDesktopPanel: (panel: Exclude<DesktopMeetingPanel, null>) => void;
  onToggleFullscreen: () => void;
  onToggleStageFocus: () => void;
  participantCount: number;
}) {
  const room = useRoomContext();
  const {
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    localParticipant,
  } = useLocalParticipant();
  const microphone = useTrackToggle({ source: Track.Source.Microphone, onDeviceError });
  const camera = useTrackToggle({ source: Track.Source.Camera, onDeviceError });
  const screenShare = useTrackToggle({ source: Track.Source.ScreenShare, onDeviceError });
  const videoDevices = useMediaDevices({ kind: 'videoinput', onError: onDeviceError });
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');
  const [busyCameraSwitch, setBusyCameraSwitch] = React.useState(false);

  const switchCamera = async () => {
    if (busyCameraSwitch) {
      return;
    }

    setBusyCameraSwitch(true);
    try {
      const activeDeviceId = room.getActiveDevice('videoinput');
      const nextDevice = getNextVideoDevice(videoDevices, activeDeviceId);
      if (nextDevice && videoDevices.length > 1) {
        await localParticipant.setCameraEnabled(true, { deviceId: nextDevice.deviceId });
        await room.switchActiveDevice('videoinput', nextDevice.deviceId, true);
        return;
      }

      const nextFacingMode = getNextFacingMode(facingMode);
      await localParticipant.setCameraEnabled(true, { facingMode: nextFacingMode });
      setFacingMode(nextFacingMode);
    } catch {
      onDeviceError();
    } finally {
      setBusyCameraSwitch(false);
    }
  };

  return (
    <div className="meeting-call-controls" aria-label="Controles de audio e video">
      <MeetingControlButton
        active={isMicrophoneEnabled}
        disabled={microphone.pending}
        icon={isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        label="Microfone"
        onClick={() => microphone.toggle()}
      />
      <MeetingControlButton
        active={isCameraEnabled}
        disabled={camera.pending}
        icon={isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        label="Camera"
        onClick={() => camera.toggle()}
      />
      <MeetingControlButton
        disabled={busyCameraSwitch}
        icon={<SwitchCamera size={18} />}
        label="Virar"
        onClick={switchCamera}
      />
      <MeetingControlButton
        active={isScreenShareEnabled}
        disabled={screenShare.pending}
        icon={<MonitorUp size={18} />}
        label="Tela"
        onClick={() => screenShare.toggle()}
      />
      <MeetingControlButton
        active={fullscreenActive}
        icon={<Maximize2 size={18} />}
        label="Tela cheia"
        onClick={onToggleFullscreen}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'participants'}
        badge={participantCount}
        icon={<Users size={18} />}
        label="Pessoas"
        panelAction
        onClick={() => onToggleDesktopPanel('participants')}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'chat'}
        icon={<MessageSquare size={18} />}
        label="Chat"
        panelAction
        onClick={() => onToggleDesktopPanel('chat')}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'share'}
        icon={<QrCode size={18} />}
        label="Link"
        panelAction
        onClick={() => onToggleDesktopPanel('share')}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'host'}
        disabled={!isHost}
        icon={<Shield size={18} />}
        label="Host"
        panelAction
        onClick={() => onToggleDesktopPanel('host')}
      />
      {fullscreenActive ? (
        <MeetingControlButton
          active={fullscreenFocus === 'self'}
          icon={<Users size={18} />}
          label={getFullscreenStageToggleLabel(fullscreenFocus)}
          onClick={onToggleStageFocus}
        />
      ) : null}
      <DisconnectButton className="meeting-control-button meeting-control-danger">
        <LogOut size={18} />
        <span>Sair</span>
      </DisconnectButton>
    </div>
  );
}

function MeetingControlButton({
  active = false,
  badge,
  disabled = false,
  icon,
  label,
  panelAction = false,
  onClick,
}: {
  active?: boolean;
  badge?: number;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  panelAction?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        'meeting-control-button',
        active ? 'is-active' : '',
        panelAction ? 'is-panel-action' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {typeof badge === 'number' ? <strong className="control-badge">{badge}</strong> : null}
    </button>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button className="secondary-action" onClick={copy}>
      <Copy size={16} />
      {copied ? 'Link copiado' : 'Copiar link'}
    </button>
  );
}

function MeetingShareCard({ url, label, compact = false }: { url: string; label: string; compact?: boolean }) {
  return (
    <div className={compact ? 'share-card compact' : 'share-card'}>
      <div className="share-card-head">
        <QrCode size={18} />
        <strong>{label}</strong>
      </div>
      <QRCodeSVG value={url} size={compact ? 112 : 148} marginSize={2} level="M" />
      <code>{url}</code>
      <CopyLinkButton url={url} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
