import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Building2,
  CalendarClock,
  Copy,
  FileText,
  Image as ImageIcon,
  LogOut,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Plus,
  QrCode,
  Send,
  Shield,
  Sparkles,
  Settings,
  SwitchCamera,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Wand2,
  X,
} from 'lucide-react';
import {
  DisconnectButton,
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
  resolveWidgetRoom,
  createTeam,
  createTeamRoom,
  getAppConfig,
  getRoom,
  joinRoom,
  listRoomInvitations,
  listTeamRooms,
  listTeams,
  listRoomChat,
  moderateRoomParticipant,
  sendRoomChatMessage,
  sendRoomInvitations,
  setRoomChatTyping,
  subscribeRoomChat,
  loadSession,
} from './api';
import type { ChatMessage, JoinResponse, MeetingRoom, RoomInvitation, Session, Team } from './types';
import { getCameraDeviceForFacingMode, getNextFacingMode } from './cameraDevices';
import {
  getFullscreenStageToggleLabel,
  toggleFullscreenStageFocus,
  type FullscreenStageFocus,
} from './fullscreenStage';
import { toggleMeetingFullscreen } from './fullscreen';
import { createMeetingUrl } from './meetingLinks';
import { toggleDesktopPanel, type DesktopMeetingPanel } from './desktopMeetingLayout';
import {
  getChatToggleControlLabelKey,
  getMeetingFocusAfterChatClick,
  getUnreadChatCount,
  type MeetingFocus,
} from './meetingFocus';
import { getMobileStageFitMode, toggleMobilePanel, type MobileMeetingPanel } from './mobileMeetingLayout';
import { mergeRoomChatMessages } from './chatMessages';
import { getTypingSummary, getVisibleTypingParticipants, type TypingParticipant } from './chatPresence';
import { getDeviceDisplayLabel, groupMediaDevices } from './mediaDevices';
import { createTranslator, resolveLocale, type AppLocale } from './i18n';
import { readWidgetEmbedParams } from './widgetEmbed';
import {
  getChatPreviewSpotlightKey,
  getMobileStageSpotlightKey,
  getSpotlightAriaLabel,
  getStageSpotlightKey,
  getStageSpotlightSelectionAfterClick,
  type StageSpotlightKey,
} from './stageSpotlight';
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
type Translate = ReturnType<typeof createTranslator>;
const browserLocale = resolveLocale(typeof navigator === 'undefined' ? [] : navigator.languages);
const I18nContext = React.createContext<Translate>(createTranslator(browserLocale));
const LocaleContext = React.createContext<AppLocale>(browserLocale);

function useMediaQuery(query: string): boolean {
  const getMatches = React.useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = React.useState(getMatches);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    updateMatches();
    mediaQuery.addEventListener('change', updateMatches);
    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}

function useT() {
  return React.useContext(I18nContext);
}

function useLocale() {
  return React.useContext(LocaleContext);
}

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
  const [locale] = React.useState<AppLocale>(browserLocale);
  const translate = React.useMemo(() => createTranslator(locale), [locale]);

  React.useEffect(() => {
    ensureBugZeroWidget();
    document.documentElement.lang = locale;
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [locale]);

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
  const isWidgetRoute = route === '/widget';

  React.useEffect(() => {
    document.body.classList.toggle('is-meeting-route', Boolean(roomMatch) || isWidgetRoute);
    document.body.classList.toggle('is-widget-route', isWidgetRoute);
    return () => {
      document.body.classList.remove('is-meeting-route');
      document.body.classList.remove('is-widget-route');
    };
  }, [isWidgetRoute, roomMatch]);

  return (
    <I18nContext.Provider value={translate}>
    <LocaleContext.Provider value={locale}>
    {isWidgetRoute ? (
      <WidgetRoute />
    ) : (
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
    )}
    </LocaleContext.Provider>
    </I18nContext.Provider>
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
  const t = useT();
  return (
    <aside className="side-rail">
      <button className="brand" onClick={() => onNavigate('/')} aria-label={t('nav.home')}>
        <span className="brand-mark">M</span>
        <span>{appName}</span>
      </button>

      <nav className="rail-nav" aria-label={t('nav.home')}>
        <button onClick={() => onNavigate('/')}>
          <Video size={18} />
          {t('nav.meetings')}
        </button>
        <button onClick={() => onNavigate('/')}>
          <Building2 size={18} />
          {t('nav.teams')}
        </button>
        <button onClick={() => onNavigate('/')}>
          <CalendarClock size={18} />
          {t('nav.rooms')}
        </button>
      </nav>

      <div className="identity-box">
        {session ? (
          <>
            <span className="avatar">{session.identity.displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{session.identity.displayName}</strong>
              <small>{session.identity.provider === 'google' ? session.identity.email : t('app.guest')}</small>
            </div>
            <button className="icon-button" onClick={onLogout} aria-label={t('controls.leave')}>
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <p>{t('app.signInHint')}</p>
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
  const t = useT();
  const [displayName, setDisplayName] = React.useState(session?.identity.displayName || '');
  const [meetingTitle, setMeetingTitle] = React.useState(`${t('dashboard.newMeeting')} amazing-ai meet`);
  const [teamName, setTeamName] = React.useState('Produto Amazing');
  const [roomTitle, setRoomTitle] = React.useState(t('dashboard.roomTitle'));
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
          <p>{t('app.productSummary')}</p>
        </div>
        <GoogleSignIn googleClientId={googleClientId} onSession={onSession} />
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="command-band">
        <div className="command-copy">
          <Sparkles size={22} />
          <div>
            <h2>{t('dashboard.instantTitle')}</h2>
            <p>{t('dashboard.instantDescription')}</p>
          </div>
        </div>
        <div className="command-form">
          {!session && (
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('dashboard.name')}
              aria-label={t('dashboard.name')}
            />
          )}
          <input
            value={meetingTitle}
            onChange={(event) => setMeetingTitle(event.target.value)}
            placeholder={t('dashboard.meetingTitle')}
            aria-label={t('dashboard.meetingTitle')}
          />
          <button className="primary-action" onClick={startInstantMeeting} disabled={busy}>
            <Plus size={18} />
            {t('dashboard.newMeeting')}
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
          <h2>{t('dashboard.previewTitle')}</h2>
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
            <h2>{t('dashboard.teamsTitle')}</h2>
            <p>{t('dashboard.teamsDescription')}</p>
          </div>
          {session?.identity.provider !== 'google' && <span className="login-required">{t('app.googleRequired')}</span>}
        </div>

        <div className="team-builder">
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder={t('dashboard.teamName')}
            disabled={session?.identity.provider !== 'google'}
          />
          <button onClick={addTeam} disabled={busy || session?.identity.provider !== 'google'}>
            <UserPlus size={17} />
            {t('dashboard.createTeam')}
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
                  {t('dashboard.room')}
                </button>
              </div>
              {rooms.map((room) => (
                <article key={room.id}>
                  <div>
                    <h3>{room.title}</h3>
                    <p>Link: /r/{room.slug}</p>
                  </div>
                  <button onClick={() => onNavigate(`/r/${room.slug}`)}>{t('dashboard.join')}</button>
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
  const t = useT();
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
            setStatus(t('google.connected'));
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
  }, [googleClientId, onSession, t]);

  if (!googleClientId) {
    return <span className="google-disabled">{t('google.disabled')}</span>;
  }

  return (
    <div className="google-box">
      <div ref={buttonRef} />
      {status && <small>{status}</small>}
    </div>
  );
}

function WidgetRoute() {
  const t = useT();
  const params = React.useMemo(() => readWidgetEmbedParams(window.location.search), []);
  const [displayName, setDisplayName] = React.useState(params.displayName);
  const [widget, setWidget] = React.useState<Awaited<ReturnType<typeof resolveWidgetRoom>>>();
  const [videoOpen, setVideoOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const enterWidget = async () => {
    if (!params.contextId) {
      setError(t('widget.contextMissing'));
      return;
    }

    setBusy(true);
    setError('');
    try {
      const response = await resolveWidgetRoom({
        contextId: params.contextId,
        displayName: displayName || t('app.guest'),
        title: params.title || params.contextId,
      });
      setWidget(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => {
    if (params.contextId && params.displayName) {
      void enterWidget();
    }
    // The widget parameters are fixed for the iframe lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="widget-shell">
      <header className="widget-header">
        <div>
          <p>{t('widget.powered')}</p>
          <h1>{params.title || t('widget.title')}</h1>
        </div>
        {widget ? (
          <a className="widget-open-link" href={widget.roomUrl} target="_blank" rel="noreferrer">
            <Maximize2 size={15} />
            {t('widget.openFull')}
          </a>
        ) : null}
      </header>

      {!widget ? (
        <section className="widget-entry">
          <MessageSquare size={28} />
          <h2>{t('widget.title')}</h2>
          <p>{params.contextId ? t('widget.subtitle') : t('widget.contextMissing')}</p>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t('widget.name')}
            aria-label={t('widget.name')}
          />
          {error ? <p className="panel-status is-danger">{error}</p> : null}
          <button className="primary-action" type="button" onClick={enterWidget} disabled={busy || !params.contextId}>
            <MessageSquare size={17} />
            {busy ? t('invite.sending') : t('widget.start')}
          </button>
        </section>
      ) : (
        <section className="widget-room">
          <div className="widget-room-toolbar">
            <button type="button" onClick={() => setVideoOpen((current) => !current)}>
              {videoOpen ? <VideoOff size={16} /> : <Video size={16} />}
              {videoOpen ? t('widget.closeVideo') : t('widget.openVideo')}
            </button>
            <CopyLinkButton url={widget.roomUrl} />
          </div>
          <MeetingChat
            roomSlug={widget.room.slug}
            localIdentityId={widget.session.identity.id}
            prominent
          />
          {videoOpen ? (
            <LiveKitRoom
              token={widget.livekit.token}
              serverUrl={widget.livekit.url}
              connect
              video
              audio
              className="widget-video-room"
              data-lk-theme="default"
            >
              <WidgetVideoBubble onClose={() => setVideoOpen(false)} />
            </LiveKitRoom>
          ) : null}
        </section>
      )}
    </main>
  );
}

function WidgetVideoBubble({ onClose }: { onClose: () => void }) {
  const t = useT();
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);
  const selectedTrack = tracks[0];

  return (
    <aside className="widget-video-bubble" aria-label={t('controls.video')}>
      <div className="widget-video-actions">
        <span>{t('controls.video')}</span>
        <button type="button" onClick={onClose} aria-label={t('widget.closeVideo')}>
          <X size={15} />
        </button>
      </div>
      <RoomAudioRenderer />
      {selectedTrack ? (
        <ParticipantTile trackRef={selectedTrack} className="widget-video-tile" />
      ) : (
        <div className="widget-video-empty">
          <Video size={20} />
          {t('stage.noVideo')}
        </div>
      )}
    </aside>
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
  const t = useT();
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
          <h1>{room?.title || t('app.loadingMeeting')}</h1>
          <p>{room?.requiresLogin ? t('lobby.persistentRequiresGoogle') : t('lobby.openByLink')}</p>
        </div>
        <CopyLinkButton url={meetingUrl} />
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="lobby-card">
        <div className="camera-check">
          <Video size={46} />
          <p>{t('lobby.cameraHint')}</p>
        </div>
        <div className="lobby-form">
          <h2>{t('lobby.enter')}</h2>
          {!session && (
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('dashboard.name')}
              aria-label={t('dashboard.name')}
            />
          )}
          <GoogleSignIn googleClientId={googleClientId} onSession={onSession} />
          <button className="primary-action" onClick={enterRoom} disabled={busy || (!session && displayName.trim().length < 2)}>
            <Video size={18} />
            {t('lobby.enterNow')}
          </button>
          <MeetingShareCard url={meetingUrl} label={t('meeting.shareRoom')} />
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
  const t = useT();
  const isHost = join.participant.role === 'host';
  const [connectionStatus, setConnectionStatus] = React.useState(t('meeting.connecting'));
  const [roomError, setRoomError] = React.useState<string | undefined>();

  const handleRoomError = React.useCallback((error: Error) => {
    setConnectionStatus(t('meeting.interrupted'));
    setRoomError(error.message || t('meeting.interrupted'));
  }, [t]);

  const handleMediaDeviceFailure = React.useCallback(() => {
    setRoomError(t('meeting.mediaPermission'));
  }, [t]);

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
            {t('controls.leave')}
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
          setConnectionStatus(t('meeting.connected'));
          setRoomError(undefined);
        }}
        onDisconnected={() => setConnectionStatus(t('meeting.disconnected'))}
        onError={handleRoomError}
        onMediaDeviceFailure={handleMediaDeviceFailure}
      >
        <MeetingExperience
          meetingUrl={meetingUrl}
          roomSlug={join.room.slug}
          localIdentityId={join.identity.id}
          isHost={isHost}
          onDeviceError={handleMediaDeviceFailure}
        />
      </LiveKitRoom>
    </section>
  );
}

function MeetingExperience({
  meetingUrl,
  roomSlug,
  localIdentityId,
  isHost,
  onDeviceError,
}: {
  meetingUrl: string;
  roomSlug: string;
  localIdentityId: string;
  isHost: boolean;
  onDeviceError: () => void;
}) {
  const t = useT();
  const layoutContext = useCreateLayoutContext();
  const stageRef = React.useRef<HTMLDivElement>(null);
  const isMobileMeeting = useMediaQuery('(max-width: 980px)');
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const participants = useParticipants();
  const [mobilePanel, setMobilePanel] = React.useState<MobileMeetingPanel>(null);
  const [desktopPanel, setDesktopPanel] = React.useState<DesktopMeetingPanel>(null);
  const [meetingFocus, setMeetingFocus] = React.useState<MeetingFocus>('video');
  const [chatMessageCount, setChatMessageCount] = React.useState(0);
  const [lastSeenChatMessageCount, setLastSeenChatMessageCount] = React.useState(0);
  const [fullscreenActive, setFullscreenActive] = React.useState(false);
  const [fullscreenFocus, setFullscreenFocus] = React.useState<FullscreenStageFocus>('friends');
  const [spotlightKey, setSpotlightKey] = React.useState<StageSpotlightKey | null>(null);

  React.useEffect(() => {
    const updateFullscreenState = () => {
      const fullscreenDocument = document as Document & { webkitFullscreenElement?: Element | null };
      const isActive = Boolean(fullscreenDocument.fullscreenElement || fullscreenDocument.webkitFullscreenElement);
      setFullscreenActive(isActive);
      if (!isActive) {
        setFullscreenFocus('friends');
        setSpotlightKey(null);
      }
    };
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const syncChatCount = async () => {
      try {
        const response = await listRoomChat(roomSlug);
        if (!cancelled) {
          setChatMessageCount(response.messages.length);
          setLastSeenChatMessageCount((current) => (meetingFocus === 'chat' ? response.messages.length : current));
        }
      } catch {
        // Chat badge is advisory; the visible chat surface reports load errors.
      }
    };

    void syncChatCount();
    const unsubscribe = subscribeRoomChat(roomSlug, (event) => {
      if (cancelled) {
        return;
      }
      if (event.type === 'snapshot') {
        setChatMessageCount(event.payload.messages.length);
        setLastSeenChatMessageCount((current) => (meetingFocus === 'chat' ? event.payload.messages.length : current));
      }
      if (event.type === 'message') {
        setChatMessageCount((current) => {
          const nextCount = Math.max(current + 1, 1);
          setLastSeenChatMessageCount((lastSeen) => (meetingFocus === 'chat' ? nextCount : lastSeen));
          return nextCount;
        });
      }
    }, () => {
      // Chat badge is advisory; the visible chat surface reports load errors and reconnects via EventSource.
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [meetingFocus, roomSlug]);

  const togglePanel = (panel: Exclude<MobileMeetingPanel, null>) => {
    setMobilePanel((current) => toggleMobilePanel(current, panel));
  };
  const toggleDesktopSidePanel = (panel: Exclude<DesktopMeetingPanel, null>) => {
    setDesktopPanel((current) => toggleDesktopPanel(current, panel));
  };
  const toggleChatFocus = () => {
    setMeetingFocus((current) => {
      const nextFocus = getMeetingFocusAfterChatClick(current);
      if (nextFocus === 'chat') {
        setLastSeenChatMessageCount(chatMessageCount);
      }
      return nextFocus;
    });
    setDesktopPanel(null);
    setMobilePanel(null);
  };
  const handleChatMessageCountChange = React.useCallback((count: number) => {
    setChatMessageCount(count);
    setLastSeenChatMessageCount((current) => (meetingFocus === 'chat' ? count : current));
  }, [meetingFocus]);
  const closeDesktopSidePanel = () => {
    setDesktopPanel(null);
  };
  const toggleFullscreen = async () => {
    const element = stageRef.current || document.documentElement;
    const entered = await toggleMeetingFullscreen(element);
    setFullscreenActive(entered);
  };
  const toggleSpotlight = async (key: StageSpotlightKey) => {
    setMeetingFocus('video');
    setDesktopPanel(null);
    setMobilePanel(null);
    setSpotlightKey((current) => getStageSpotlightSelectionAfterClick(current, key));
    if (!fullscreenActive) {
      await toggleFullscreen();
    }
  };
  const selectChatPreviewSpotlight = (key: StageSpotlightKey) => {
    setSpotlightKey(key);
  };
  const selectMobileStageSpotlight = (key: StageSpotlightKey) => {
    setMeetingFocus('video');
    setDesktopPanel(null);
    setMobilePanel(null);
    setSpotlightKey(key);
  };
  const toggleStageFocus = () => {
    setSpotlightKey(null);
    setFullscreenFocus((current) => toggleFullscreenStageFocus(current));
  };

  return (
    <LayoutContextProvider value={layoutContext}>
      <div
        className={
          fullscreenActive
            ? `meeting-livekit-layout is-fullscreen is-stage-${fullscreenFocus} is-focus-${meetingFocus}`
            : `meeting-livekit-layout is-focus-${meetingFocus}`
        }
        ref={stageRef}
      >
        <div className={meetingFocus === 'chat' ? 'meeting-video-panel is-chat-focus' : 'meeting-video-panel'}>
          <RoomAudioRenderer />
          {meetingFocus === 'chat' ? (
            <MeetingChatFocus
              localIdentityId={localIdentityId}
              onMessageCountChange={handleChatMessageCountChange}
              onBackToVideo={toggleChatFocus}
              onSelectSpotlight={selectChatPreviewSpotlight}
              roomSlug={roomSlug}
              selectedSpotlightKey={spotlightKey}
              tracks={tracks}
            />
          ) : (
            <MeetingVideoStage
              tracks={tracks}
              fullscreenActive={fullscreenActive}
              fullscreenFocus={fullscreenFocus}
              immersiveMobile={isMobileMeeting}
              selectedSpotlightKey={spotlightKey}
              onSelectMobileSpotlight={selectMobileStageSpotlight}
              onToggleSpotlight={toggleSpotlight}
            />
          )}
          <MeetingCallControls
            activeDesktopPanel={desktopPanel}
            fullscreenActive={fullscreenActive}
            fullscreenFocus={fullscreenFocus}
            meetingFocus={meetingFocus}
            isHost={isHost}
            onDeviceError={onDeviceError}
            onToggleChatFocus={toggleChatFocus}
            onToggleDesktopPanel={toggleDesktopSidePanel}
            onToggleFullscreen={toggleFullscreen}
            onToggleStageFocus={toggleStageFocus}
            participantCount={participants.length}
            unreadChatCount={getUnreadChatCount(meetingFocus, chatMessageCount, lastSeenChatMessageCount)}
          />
          <div className="mobile-meeting-tabs" aria-label={t('meeting.share')}>
            <button
              type="button"
              className={mobilePanel === 'participants' ? 'active' : ''}
              aria-expanded={mobilePanel === 'participants'}
              onClick={() => togglePanel('participants')}
            >
              <Users size={16} />
              {t('controls.people')}
            </button>
            <button
              type="button"
              className={mobilePanel === 'share' ? 'active' : ''}
              aria-expanded={mobilePanel === 'share'}
              onClick={() => togglePanel('share')}
            >
              <QrCode size={16} />
              {t('controls.link')}
            </button>
            <button
              type="button"
              className={mobilePanel === 'effects' ? 'active' : ''}
              aria-expanded={mobilePanel === 'effects'}
              onClick={() => togglePanel('effects')}
            >
              <Wand2 size={16} />
              {t('controls.effects')}
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
          <section className="participants-panel" aria-label={t('controls.people')}>
            <div className="panel-title-row">
              <h2>{t('controls.people')}</h2>
              <span>{participants.length}</span>
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label={t('meeting.panelClose')}>
                <X size={16} />
              </button>
            </div>
            <MeetingParticipantsList
              roomSlug={roomSlug}
              isHost={isHost}
              localIdentityId={localIdentityId}
            />
          </section>

          <section className="share-panel" aria-label={t('meeting.share')}>
            <div className="panel-title-row share-title-row">
              <h2>{t('controls.link')}</h2>
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label={t('meeting.panelClose')}>
                <X size={16} />
              </button>
            </div>
            <MeetingShareCard url={meetingUrl} label={t('meeting.share')} compact />
            <MeetingInviteForm roomSlug={roomSlug} isHost={isHost} />
          </section>

          <section className="devices-panel" aria-label={t('controls.devices')}>
            <div className="panel-title-row">
              <h2>{t('controls.devices')}</h2>
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label={t('meeting.panelClose')}>
                <X size={16} />
              </button>
            </div>
            <MeetingDeviceSettings onDeviceError={onDeviceError} />
          </section>

          <section className="effects-panel" aria-label={t('controls.effects')}>
            <div className="panel-title-row">
              <h2>{t('controls.effects')}</h2>
              <Wand2 size={16} />
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label={t('meeting.panelClose')}>
                <X size={16} />
              </button>
            </div>
            <BackgroundEffectsPanel onDeviceError={onDeviceError} />
          </section>

          <section className="host-tools-panel" aria-label={t('controls.host')}>
            <div className="panel-title-row">
              <h2>{t('controls.host')}</h2>
              <Shield size={16} />
              <button type="button" className="panel-close-button" onClick={closeDesktopSidePanel} aria-label={t('meeting.panelClose')}>
                <X size={16} />
              </button>
            </div>
            <p>
              {isHost
                ? t('moderation.hostHint')
                : t('moderation.hostOnly')}
            </p>
          </section>
        </div>
      </div>
    </LayoutContextProvider>
  );
}

function MeetingParticipantsList({
  roomSlug,
  isHost,
  localIdentityId,
}: {
  roomSlug: string;
  isHost: boolean;
  localIdentityId: string;
}) {
  const t = useT();
  const participants = useParticipants();
  const [blockedIdentityIds, setBlockedIdentityIds] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    listRoomChat(roomSlug)
      .then(({ blockedIdentityIds: blocked }) => setBlockedIdentityIds(blocked))
      .catch(() => setBlockedIdentityIds([]));
  }, [roomSlug]);

  const moderate = async (
    action: 'mute' | 'remove' | 'block-chat' | 'unblock-chat',
    targetIdentityId: string,
    trackSid?: string,
  ) => {
    setStatus('');
    try {
      const result = await moderateRoomParticipant(roomSlug, action === 'mute'
        ? { action, targetIdentityId, trackSid }
        : { action, targetIdentityId });
      if (result.blockedIdentityIds) {
        setBlockedIdentityIds(result.blockedIdentityIds);
      }
      setStatus(getModerationStatus(t, action, result.muted));
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <div className="participants-list-shell">
      <ul className="participants-list">
        {participants.map((participant) => {
          const microphonePublication = participant.getTrackPublication(Track.Source.Microphone);
          const blocked = blockedIdentityIds.includes(participant.identity);
          const canModerate = isHost && participant.identity !== localIdentityId;

          return (
            <li key={participant.identity}>
              <span className="participant-dot" />
              <span className="participant-name">{participant.name || participant.identity}</span>
              {participant.isLocal ? <small>{t('status.you')}</small> : null}
              {canModerate ? (
                <div className="participant-actions">
                  <button
                    type="button"
                    title={t('moderation.mute')}
                    onClick={() => moderate('mute', participant.identity, microphonePublication?.trackSid)}
                  >
                    <MicOff size={14} />
                  </button>
                  <button
                    type="button"
                    title={blocked ? t('moderation.unblockChat') : t('moderation.blockChat')}
                    onClick={() => moderate(blocked ? 'unblock-chat' : 'block-chat', participant.identity)}
                  >
                    <MessageSquare size={14} />
                  </button>
                  <button
                    type="button"
                    className="danger-mini"
                    title={t('moderation.remove')}
                    onClick={() => moderate('remove', participant.identity)}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {status ? <p className="panel-status">{status}</p> : null}
    </div>
  );
}

function MeetingChat({
  roomSlug,
  localIdentityId,
  onMessageCountChange,
  prominent = false,
}: {
  roomSlug: string;
  localIdentityId: string;
  onMessageCountChange?: (count: number) => void;
  prominent?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [blockedIdentityIds, setBlockedIdentityIds] = React.useState<string[]>([]);
  const [text, setText] = React.useState('');
  const [attachment, setAttachment] = React.useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  }>();
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [typingParticipants, setTypingParticipants] = React.useState<TypingParticipant[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingStopTimerRef = React.useRef<number>();
  const typingActiveRef = React.useRef(false);

  const loadChat = React.useCallback(async () => {
    const response = await listRoomChat(roomSlug);
    setMessages(response.messages);
    setBlockedIdentityIds(response.blockedIdentityIds);
    onMessageCountChange?.(response.messages.length);
  }, [onMessageCountChange, roomSlug]);

  React.useEffect(() => {
    loadChat().catch((err: Error) => setStatus(err.message));
    const unsubscribe = subscribeRoomChat(roomSlug, (event) => {
      if (event.type === 'snapshot') {
        setStatus('');
        setMessages(event.payload.messages);
        setBlockedIdentityIds(event.payload.blockedIdentityIds);
        onMessageCountChange?.(event.payload.messages.length);
        return;
      }
      if (event.type === 'message') {
        setStatus('');
        setMessages((current) => {
          const nextMessages = mergeRoomChatMessages(current, [event.payload.message]);
          onMessageCountChange?.(nextMessages.length);
          return nextMessages;
        });
        return;
      }
      if (event.type === 'blocked') {
        setBlockedIdentityIds(event.payload.blockedIdentityIds);
      }
      if (event.type === 'typing') {
        setTypingParticipants((current) => {
          const next = current.filter((participant) => participant.identityId !== event.payload.identityId);
          if (!event.payload.typing) {
            return next;
          }
          return [
            ...next,
            {
              identityId: event.payload.identityId,
              displayName: event.payload.displayName,
            },
          ];
        });
      }
    }, () => {
      setStatus((current) => current || t('chat.reconnecting'));
    });
    return unsubscribe;
  }, [loadChat, t]);

  React.useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (typingActiveRef.current) {
        void setRoomChatTyping(roomSlug, false);
      }
    };
  }, [roomSlug]);

  const announceTyping = React.useCallback((nextText: string) => {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }

    if (nextText.trim()) {
      if (!typingActiveRef.current) {
        typingActiveRef.current = true;
        void setRoomChatTyping(roomSlug, true).catch(() => undefined);
      }
      typingStopTimerRef.current = window.setTimeout(() => {
        typingActiveRef.current = false;
        void setRoomChatTyping(roomSlug, false).catch(() => undefined);
      }, 1800);
      return;
    }

    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      void setRoomChatTyping(roomSlug, false).catch(() => undefined);
    }
  }, [roomSlug]);

  const pickAttachment = async (file: File | undefined) => {
    setStatus('');
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus(t('status.fileTooLarge'));
      return;
    }

    setAttachment({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl: await readFileAsDataUrl(file),
    });
  };

  const sendMessage = async () => {
    if (!text.trim() && !attachment) {
      return;
    }

    setBusy(true);
    setStatus('');
    try {
      const { message } = await sendRoomChatMessage(roomSlug, { text, attachment });
      setMessages((current) => {
        const nextMessages = mergeRoomChatMessages(current, [message]);
        onMessageCountChange?.(nextMessages.length);
        return nextMessages;
      });
      setText('');
      announceTyping('');
      setAttachment(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const blocked = blockedIdentityIds.includes(localIdentityId);
  const visibleTypingParticipants = getVisibleTypingParticipants(typingParticipants, localIdentityId);
  const typingSummary = getTypingSummary(visibleTypingParticipants, locale);

  return (
    <div className={prominent ? 'custom-chat is-prominent' : 'custom-chat'}>
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <MessageSquare size={22} />
            <p>{t('chat.empty')}</p>
            <span>{t('chat.emptyHint')}</span>
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={message.senderIdentityId === localIdentityId ? 'chat-message is-local' : 'chat-message'}
            >
              <header>
                <strong>{message.senderName}</strong>
                <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </header>
              {message.text ? <p>{message.text}</p> : null}
              {message.attachment ? <ChatAttachmentView message={message} /> : null}
            </article>
          ))
        )}
      </div>

      {attachment ? (
        <div className="attachment-preview">
          {attachment.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
          <span>{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(undefined)} aria-label={t('chat.removeAttachment')}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      {typingSummary ? <p className="typing-indicator">{typingSummary}</p> : null}
      {status ? <p className="panel-status">{status}</p> : null}
      {blocked ? <p className="panel-status is-danger">{t('chat.blocked')}</p> : null}

      <div className="chat-compose">
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            announceTyping(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          placeholder={prominent ? t('chat.inputProminent') : t('chat.input')}
          disabled={blocked}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          className="visually-hidden-file"
          onChange={(event) => void pickAttachment(event.target.files?.[0])}
        />
        <button
          type="button"
          className="chat-icon-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={blocked}
          aria-label={t('chat.attach')}
          title={t('chat.attach')}
        >
          <FileText size={17} />
        </button>
        <button
          type="button"
          className="chat-send-button"
          onClick={sendMessage}
          disabled={busy || blocked}
          aria-label={t('chat.send')}
          title={t('chat.send')}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

function ChatAttachmentView({ message }: { message: ChatMessage }) {
  const attachment = message.attachment!;
  if (attachment.kind === 'image') {
    return (
      <a href={attachment.dataUrl} download={attachment.name} className="chat-image-attachment">
        <img src={attachment.dataUrl} alt={attachment.name} />
        <span>{attachment.name}</span>
      </a>
    );
  }

  return (
    <a href={attachment.dataUrl} download={attachment.name} className="chat-file-attachment">
      <FileText size={17} />
      <span>{attachment.name}</span>
    </a>
  );
}

function BackgroundEffectsPanel({ onDeviceError }: { onDeviceError: () => void }) {
  const t = useT();
  const { localParticipant } = useLocalParticipant();
  const processorRef = React.useRef<{
    switchTo: (options:
      | { mode: 'disabled' }
      | { mode: 'background-blur'; blurRadius?: number }
      | { mode: 'virtual-background'; imagePath: string }) => Promise<void>;
  }>();
  const [activeEffect, setActiveEffect] = React.useState<'none' | 'blur' | 'brand' | 'custom'>('none');
  const [status, setStatus] = React.useState('');

  const applyEffect = async (effect: 'none' | 'blur' | 'brand' | 'custom', imagePath?: string) => {
    setStatus('');
    try {
      const publication = await ensureLocalCameraPublication(localParticipant);
      const videoTrack = publication?.videoTrack;
      if (!videoTrack) {
        throw new Error(t('background.turnCameraOn'));
      }

      if (effect === 'none') {
        if (processorRef.current) {
          await processorRef.current.switchTo({ mode: 'disabled' });
        } else if ('stopProcessor' in videoTrack) {
          await videoTrack.stopProcessor();
        }
        setActiveEffect('none');
        return;
      }

      const { BackgroundProcessor, supportsBackgroundProcessors } = await import('@livekit/track-processors');
      if (!supportsBackgroundProcessors()) {
        throw new Error(t('background.notSupported'));
      }

      const options =
        effect === 'blur'
          ? { mode: 'background-blur' as const, blurRadius: 12 }
          : { mode: 'virtual-background' as const, imagePath: imagePath || '/backgrounds/amazing-ai-meet.svg' };

      if (processorRef.current) {
        await processorRef.current.switchTo(options);
      } else {
        const processor = BackgroundProcessor(options);
        await videoTrack.setProcessor(processor, true);
        processorRef.current = processor;
      }
      setActiveEffect(effect);
    } catch (err) {
      onDeviceError();
      setStatus((err as Error).message);
    }
  };

  const uploadBackground = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setStatus(t('background.chooseImage'));
      return;
    }
    await applyEffect('custom', await readFileAsDataUrl(file));
  };

  return (
    <div className="effects-options">
      <button type="button" className={activeEffect === 'none' ? 'active' : ''} onClick={() => void applyEffect('none')}>
        {t('background.noEffect')}
      </button>
      <button type="button" className={activeEffect === 'blur' ? 'active' : ''} onClick={() => void applyEffect('blur')}>
        {t('background.blur')}
      </button>
      <button type="button" className={activeEffect === 'brand' ? 'active' : ''} onClick={() => void applyEffect('brand')}>
        {t('background.brand')}
      </button>
      <label className={activeEffect === 'custom' ? 'active effect-upload' : 'effect-upload'}>
        {t('background.custom')}
        <input type="file" accept="image/*" onChange={(event) => void uploadBackground(event.target.files?.[0])} />
      </label>
      {status ? <p className="panel-status is-danger">{status}</p> : null}
    </div>
  );
}

type MeetingTrack = ReturnType<typeof useTracks>[number];

function MeetingVideoStage({
  tracks,
  fullscreenActive,
  fullscreenFocus,
  immersiveMobile,
  selectedSpotlightKey,
  onSelectMobileSpotlight,
  onToggleSpotlight,
}: {
  tracks: MeetingTrack[];
  fullscreenActive: boolean;
  fullscreenFocus: FullscreenStageFocus;
  immersiveMobile: boolean;
  selectedSpotlightKey: StageSpotlightKey | null;
  onSelectMobileSpotlight: (key: StageSpotlightKey) => void;
  onToggleSpotlight: (key: StageSpotlightKey) => void | Promise<void>;
}) {
  const t = useT();
  const selectedTrack = selectedSpotlightKey
    ? tracks.find((track) => getMeetingTrackSpotlightKey(track) === selectedSpotlightKey)
    : undefined;

  if (immersiveMobile && !fullscreenActive) {
    return (
      <MobileImmersiveVideoStage
        tracks={tracks}
        selectedSpotlightKey={selectedSpotlightKey}
        onSelectSpotlight={onSelectMobileSpotlight}
      />
    );
  }

  if (!fullscreenActive) {
    return (
      <div className="meeting-video-grid" aria-label="Videos da reuniao">
        {tracks.map((track) => (
          <MeetingStageTile
            key={getMeetingTrackSpotlightKey(track)}
            track={track}
            selected={getMeetingTrackSpotlightKey(track) === selectedSpotlightKey}
            onToggleSpotlight={onToggleSpotlight}
          />
        ))}
      </div>
    );
  }

  const localCameraTrack =
    tracks.find((track) => track.participant.isLocal && track.source === Track.Source.Camera) ||
    tracks.find((track) => track.participant.isLocal);
  const friendTracks = tracks.filter((track) => !track.participant.isLocal);
  const selfTracks = localCameraTrack ? [localCameraTrack] : [];
  const primaryTracks = selectedTrack ? [selectedTrack] : fullscreenFocus === 'self' ? selfTracks : friendTracks;
  const showLocalPreview =
    Boolean(localCameraTrack) &&
    fullscreenFocus === 'friends' &&
    (!selectedTrack || !selectedTrack.participant.isLocal || selectedTrack.source === Track.Source.ScreenShare);

  return (
    <div className="fullscreen-stage" aria-label={t('controls.fullscreen')}>
      <div className={primaryTracks.length > 1 ? 'fullscreen-stage-grid' : 'fullscreen-stage-grid single'}>
        {primaryTracks.length > 0 ? (
          primaryTracks.map((track) => (
            <MeetingStageTile
              key={`${track.participant.identity}-${track.source}`}
              track={track}
              selected={getMeetingTrackSpotlightKey(track) === selectedSpotlightKey}
              onToggleSpotlight={onToggleSpotlight}
              tileClassName="fullscreen-stage-tile"
            />
          ))
        ) : (
          <div className="fullscreen-stage-empty">
            {fullscreenFocus === 'friends'
              ? t('fullscreen.waitingFriends')
              : t('fullscreen.waitingSelf')}
          </div>
        )}
      </div>

      {showLocalPreview && localCameraTrack ? (
        <aside className="local-camera-preview" aria-label={t('stage.self')}>
          <MeetingStageTile
            track={localCameraTrack}
            selected={getMeetingTrackSpotlightKey(localCameraTrack) === selectedSpotlightKey}
            onToggleSpotlight={onToggleSpotlight}
            tileClassName="local-camera-preview-tile"
          />
          <span>{t('stage.self')}</span>
        </aside>
      ) : null}

      {tracks.length > 1 ? (
        <div className="stage-thumbnail-strip" aria-label={t('stage.choose')}>
          {tracks.map((track) => (
            <MeetingStageTile
              key={getMeetingTrackSpotlightKey(track)}
              track={track}
              selected={getMeetingTrackSpotlightKey(track) === selectedSpotlightKey}
              onToggleSpotlight={onToggleSpotlight}
              tileClassName="stage-thumbnail-tile"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileImmersiveVideoStage({
  tracks,
  selectedSpotlightKey,
  onSelectSpotlight,
}: {
  tracks: MeetingTrack[];
  selectedSpotlightKey: StageSpotlightKey | null;
  onSelectSpotlight: (key: StageSpotlightKey) => void;
}) {
  const t = useT();
  const activeSpotlightKey = getMobileStageSpotlightKey(
    tracks.map((track) => ({
      key: getMeetingTrackSpotlightKey(track),
      isLocal: track.participant.isLocal,
      source: track.source,
    })),
    selectedSpotlightKey,
  );
  const activeTrack = activeSpotlightKey
    ? tracks.find((track) => getMeetingTrackSpotlightKey(track) === activeSpotlightKey)
    : undefined;
  const thumbnailTracks = activeSpotlightKey
    ? tracks.filter((track) => getMeetingTrackSpotlightKey(track) !== activeSpotlightKey)
    : tracks.slice(1);

  return (
    <div className="mobile-immersive-stage" aria-label={t('stage.choose')}>
      <div className="mobile-immersive-main">
        {activeTrack ? (
          <MeetingStageTile
            track={activeTrack}
            selected
            onToggleSpotlight={onSelectSpotlight}
            tileClassName={`mobile-immersive-main-tile is-fit-${getMobileStageFitMode(
              activeTrack.source === Track.Source.ScreenShare ? 'screen_share' : 'camera',
            )}`}
          />
        ) : (
          <div className="fullscreen-stage-empty">{t('stage.noVideo')}</div>
        )}
      </div>

      {thumbnailTracks.length > 0 ? (
        <div className="mobile-immersive-thumbnails" aria-label={t('stage.choose')}>
          {thumbnailTracks.map((track) => {
            const key = getMeetingTrackSpotlightKey(track);
            return (
              <MeetingStageTile
                key={key}
                track={track}
                selected={key === activeSpotlightKey}
                onToggleSpotlight={onSelectSpotlight}
                tileClassName="mobile-immersive-thumbnail-tile"
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function getMeetingTrackSpotlightKey(track: MeetingTrack): StageSpotlightKey {
  return getStageSpotlightKey({
    participantIdentity: track.participant.identity,
    isLocal: track.participant.isLocal,
    source: track.source,
    publicationTrackSid: track.publication?.trackSid,
  });
}

function getMeetingTrackLabel(track: MeetingTrack): string {
  return track.participant.name || track.participant.identity || 'Participante';
}

function MeetingStageTile({
  track,
  selected,
  ariaLabel,
  tileClassName = '',
  onToggleSpotlight,
}: {
  track: MeetingTrack;
  selected: boolean;
  ariaLabel?: string;
  tileClassName?: string;
  onToggleSpotlight: (key: StageSpotlightKey) => void | Promise<void>;
}) {
  const t = useT();
  const participantName = getMeetingTrackLabel(track);
  const spotlightKey = getMeetingTrackSpotlightKey(track);
  const sourceLabel = track.source === Track.Source.ScreenShare ? t('stage.screen') : t('stage.camera');
  const buttonLabel = ariaLabel || getSpotlightAriaLabel({ participantName, source: track.source });

  return (
    <button
      type="button"
      className={['meeting-stage-tile-button', selected ? 'is-selected' : '', tileClassName].filter(Boolean).join(' ')}
      aria-label={buttonLabel}
      aria-pressed={selected}
      title={buttonLabel}
      onClick={() => void onToggleSpotlight(spotlightKey)}
    >
      <ParticipantTile trackRef={track} className="meeting-stage-participant-tile" />
      <span className="meeting-stage-tile-chip">{sourceLabel}</span>
    </button>
  );
}

function MeetingChatFocus({
  roomSlug,
  localIdentityId,
  onMessageCountChange,
  tracks,
  onBackToVideo,
  onSelectSpotlight,
  selectedSpotlightKey,
}: {
  roomSlug: string;
  localIdentityId: string;
  onMessageCountChange: (count: number) => void;
  tracks: MeetingTrack[];
  onBackToVideo: () => void;
  onSelectSpotlight: (key: StageSpotlightKey) => void;
  selectedSpotlightKey: StageSpotlightKey | null;
}) {
  const t = useT();
  const previewSpotlightKey = getChatPreviewSpotlightKey(
    tracks.map((track) => ({
      key: getMeetingTrackSpotlightKey(track),
      isLocal: track.participant.isLocal,
      source: track.source,
    })),
    selectedSpotlightKey,
  );
  const previewTrack = previewSpotlightKey
    ? tracks.find((track) => getMeetingTrackSpotlightKey(track) === previewSpotlightKey)
    : undefined;
  const previewTrackLabel = previewTrack ? getMeetingTrackLabel(previewTrack) : t('controls.video');

  return (
    <section className="meeting-chat-focus" aria-label={t('chat.focusEyebrow')}>
      <div className="chat-focus-main">
        <div className="chat-focus-header">
          <div>
            <p>{t('chat.focusEyebrow')}</p>
            <h2>{t('chat.focusTitle')}</h2>
          </div>
          <button type="button" className="chat-focus-video-button" onClick={onBackToVideo}>
            <Video size={17} />
            {t('controls.video')}
          </button>
        </div>
        <MeetingChat
          roomSlug={roomSlug}
          localIdentityId={localIdentityId}
          onMessageCountChange={onMessageCountChange}
          prominent
        />
      </div>

      <aside className="chat-video-preview" aria-label={t('stage.thumbnail')}>
        <div className="chat-video-preview-head">
          <span>{previewTrackLabel}</span>
          <button type="button" onClick={onBackToVideo}>
            {t('stage.enlarge')}
          </button>
        </div>
        {previewTrack ? (
          <ParticipantTile trackRef={previewTrack} className="chat-video-preview-tile" />
        ) : (
          <div className="chat-video-preview-empty">{t('stage.noVideo')}</div>
        )}
        {tracks.length > 1 ? (
          <div className="chat-preview-strip" aria-label={t('stage.choose')}>
            {tracks.map((track) => {
              const key = getMeetingTrackSpotlightKey(track);
              const participantName = getMeetingTrackLabel(track);
              const mediaLabel = track.source === Track.Source.ScreenShare ? t('stage.screen') : t('stage.camera');

              return (
                <MeetingStageTile
                  key={key}
                  track={track}
                  selected={key === previewSpotlightKey}
                  ariaLabel={t('stage.showInChat', { media: mediaLabel, participant: participantName })}
                  onToggleSpotlight={onSelectSpotlight}
                  tileClassName="chat-preview-selector-tile"
                />
              );
            })}
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function MeetingDeviceSettings({ onDeviceError }: { onDeviceError: () => void }) {
  const t = useT();
  const room = useRoomContext();
  const { isCameraEnabled, isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const videoDevices = useMediaDevices({ kind: 'videoinput', onError: onDeviceError });
  const microphoneDevices = useMediaDevices({ kind: 'audioinput', onError: onDeviceError });
  const speakerDevices = useMediaDevices({ kind: 'audiooutput', onError: onDeviceError });
  const groupedDevices = groupMediaDevices([...videoDevices, ...microphoneDevices, ...speakerDevices]);
  const [activeCameraId, setActiveCameraId] = React.useState(() => room.getActiveDevice('videoinput') || '');
  const [activeMicrophoneId, setActiveMicrophoneId] = React.useState(() => room.getActiveDevice('audioinput') || '');
  const [activeSpeakerId, setActiveSpeakerId] = React.useState(() => room.getActiveDevice('audiooutput') || '');
  const [status, setStatus] = React.useState('');
  const outputSelectionSupported = typeof HTMLMediaElement !== 'undefined'
    && 'setSinkId' in HTMLMediaElement.prototype;

  const selectCamera = async (deviceId: string) => {
    setStatus('');
    try {
      await localParticipant.setCameraEnabled(true, { deviceId });
      await room.switchActiveDevice('videoinput', deviceId, true);
      setActiveCameraId(deviceId);
    } catch {
      onDeviceError();
      setStatus(t('devices.cameraError'));
    }
  };

  const selectMicrophone = async (deviceId: string) => {
    setStatus('');
    try {
      await localParticipant.setMicrophoneEnabled(true, { deviceId });
      await room.switchActiveDevice('audioinput', deviceId, true);
      setActiveMicrophoneId(deviceId);
    } catch {
      onDeviceError();
      setStatus(t('devices.microphoneError'));
    }
  };

  const selectSpeaker = async (deviceId: string) => {
    setStatus('');
    try {
      await room.switchActiveDevice('audiooutput', deviceId, true);
      setActiveSpeakerId(deviceId);
    } catch {
      setStatus(t('devices.speakerError'));
    }
  };

  return (
    <div className="device-settings-panel">
      <p>
        {t('devices.description')}
      </p>
      <MeetingDeviceSelect
        label={t('devices.camera')}
        devices={groupedDevices.cameras}
        activeDeviceId={activeCameraId}
        disabled={false}
        emptyLabel={t('devices.emptyCamera')}
        onSelect={(deviceId) => void selectCamera(deviceId)}
      />
      <MeetingDeviceSelect
        label={t('devices.microphone')}
        devices={groupedDevices.microphones}
        activeDeviceId={activeMicrophoneId}
        disabled={false}
        emptyLabel={t('devices.emptyMicrophone')}
        onSelect={(deviceId) => void selectMicrophone(deviceId)}
      />
      <MeetingDeviceSelect
        label={t('devices.speaker')}
        devices={groupedDevices.speakers}
        activeDeviceId={activeSpeakerId}
        disabled={!outputSelectionSupported}
        emptyLabel={outputSelectionSupported ? t('devices.emptySpeaker') : t('devices.emptySpeakerUnsupported')}
        onSelect={(deviceId) => void selectSpeaker(deviceId)}
      />
      <div className="device-state-row">
        <span className={isCameraEnabled ? 'is-on' : ''}>{isCameraEnabled ? t('devices.cameraOn') : t('devices.cameraOff')}</span>
        <span className={isMicrophoneEnabled ? 'is-on' : ''}>{isMicrophoneEnabled ? t('devices.microphoneOn') : t('devices.microphoneMuted')}</span>
      </div>
      {status ? <p className="panel-status">{status}</p> : null}
    </div>
  );
}

function MeetingDeviceSelect({
  activeDeviceId,
  devices,
  disabled,
  emptyLabel,
  label,
  onSelect,
}: {
  activeDeviceId: string;
  devices: MediaDeviceInfo[];
  disabled: boolean;
  emptyLabel: string;
  label: string;
  onSelect: (deviceId: string) => void;
}) {
  if (devices.length === 0) {
    return (
      <label className="device-select-row">
        <span>{label}</span>
        <select disabled>
          <option>{emptyLabel}</option>
        </select>
      </label>
    );
  }

  return (
    <label className="device-select-row">
      <span>{label}</span>
      <select
        value={activeDeviceId || devices[0]?.deviceId || ''}
        disabled={disabled}
        onChange={(event) => onSelect(event.target.value)}
      >
        {devices.map((device, index) => (
          <option key={`${device.kind}-${device.deviceId}`} value={device.deviceId}>
            {getDeviceDisplayLabel(device, index)}
          </option>
        ))}
      </select>
    </label>
  );
}

function MeetingCallControls({
  activeDesktopPanel,
  fullscreenActive,
  fullscreenFocus,
  meetingFocus,
  isHost,
  onDeviceError,
  onToggleChatFocus,
  onToggleDesktopPanel,
  onToggleFullscreen,
  onToggleStageFocus,
  participantCount,
  unreadChatCount,
}: {
  activeDesktopPanel: DesktopMeetingPanel;
  fullscreenActive: boolean;
  fullscreenFocus: FullscreenStageFocus;
  meetingFocus: MeetingFocus;
  isHost: boolean;
  onDeviceError: () => void;
  onToggleChatFocus: () => void;
  onToggleDesktopPanel: (panel: Exclude<DesktopMeetingPanel, null>) => void;
  onToggleFullscreen: () => void;
  onToggleStageFocus: () => void;
  participantCount: number;
  unreadChatCount: number;
}) {
  const t = useT();
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
      const nextFacingMode = getNextFacingMode(facingMode);
      const nextDevice = getCameraDeviceForFacingMode(videoDevices, nextFacingMode);
      if (nextDevice && videoDevices.length > 1) {
        await localParticipant.setCameraEnabled(true, { deviceId: nextDevice.deviceId });
        await room.switchActiveDevice('videoinput', nextDevice.deviceId, true);
        setFacingMode(nextFacingMode);
        return;
      }

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
        label={t('controls.microphone')}
        onClick={() => microphone.toggle()}
      />
      <MeetingControlButton
        active={isCameraEnabled}
        disabled={camera.pending}
        icon={isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        label={t('controls.camera')}
        onClick={() => camera.toggle()}
      />
      <MeetingControlButton
        className="meeting-control-mobile-only"
        disabled={busyCameraSwitch}
        icon={<SwitchCamera size={18} />}
        label={t('controls.switchCamera')}
        onClick={switchCamera}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'devices'}
        className="meeting-control-desktop-only"
        icon={<Settings size={18} />}
        label={t('controls.devices')}
        panelAction
        onClick={() => onToggleDesktopPanel('devices')}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'effects'}
        icon={<Wand2 size={18} />}
        label={t('controls.effects')}
        panelAction
        onClick={() => onToggleDesktopPanel('effects')}
      />
      <MeetingControlButton
        active={isScreenShareEnabled}
        disabled={screenShare.pending}
        icon={<MonitorUp size={18} />}
        label={t('controls.screen')}
        onClick={() => screenShare.toggle()}
      />
      <MeetingControlButton
        active={fullscreenActive}
        icon={<Maximize2 size={18} />}
        label={t('controls.fullscreen')}
        onClick={onToggleFullscreen}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'participants'}
        badge={participantCount}
        icon={<Users size={18} />}
        label={t('controls.people')}
        panelAction
        onClick={() => onToggleDesktopPanel('participants')}
      />
      <MeetingControlButton
        active={meetingFocus === 'chat'}
        badge={unreadChatCount > 0 ? unreadChatCount : undefined}
        className="meeting-control-chat-toggle"
        icon={
          <div className="chat-video-toggle-icon" aria-hidden="true">
            <MessageSquare size={18} />
            <Video size={10} />
          </div>
        }
        label={
          unreadChatCount > 0
              ? t('controls.chatUnread', { count: unreadChatCount })
              : t(getChatToggleControlLabelKey(meetingFocus))
        }
        onClick={onToggleChatFocus}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'share'}
        icon={<QrCode size={18} />}
        label={t('controls.link')}
        panelAction
        onClick={() => onToggleDesktopPanel('share')}
      />
      <MeetingControlButton
        active={activeDesktopPanel === 'host'}
        disabled={!isHost}
        icon={<Shield size={18} />}
        label={t('controls.host')}
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
      <DisconnectButton className="meeting-control-button meeting-control-danger" aria-label={t('controls.leave')} title={t('controls.leave')}>
        <LogOut size={18} />
        <span>{t('controls.leave')}</span>
      </DisconnectButton>
    </div>
  );
}

function MeetingControlButton({
  active = false,
  badge,
  className = '',
  disabled = false,
  icon,
  label,
  panelAction = false,
  onClick,
}: {
  active?: boolean;
  badge?: number;
  className?: string;
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
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {typeof badge === 'number' ? <strong className="control-badge">{badge}</strong> : null}
    </button>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const t = useT();
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button className="secondary-action" onClick={copy}>
      <Copy size={16} />
      {copied ? t('share.copied') : t('share.copy')}
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

function MeetingInviteForm({ roomSlug, isHost }: { roomSlug: string; isHost: boolean }) {
  const t = useT();
  const [emails, setEmails] = React.useState('');
  const [scheduledAt, setScheduledAt] = React.useState('');
  const [note, setNote] = React.useState('');
  const [invitations, setInvitations] = React.useState<RoomInvitation[]>([]);
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!isHost) {
      return;
    }

    listRoomInvitations(roomSlug)
      .then(({ invitations: saved }) => setInvitations(saved))
      .catch(() => undefined);
  }, [isHost, roomSlug]);

  if (!isHost) {
    return (
      <div className="invite-card">
        <div className="invite-card-head">
          <UserPlus size={17} />
          <strong>{t('invite.titleHostOnly')}</strong>
        </div>
        <p>{t('invite.hostOnly')}</p>
      </div>
    );
  }

  const submit = async () => {
    if (!emails.trim()) {
      setStatus(t('invite.emptyEmail'));
      return;
    }

    setBusy(true);
    setStatus('');
    try {
      const response = await sendRoomInvitations(roomSlug, {
        emails,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        note,
      });
      setInvitations(response.invitations);
      setEmails('');
      setNote('');
      setStatus(response.smtpConfigured
        ? t('invite.sent')
        : t('invite.pendingSmtp'));
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="invite-card">
      <div className="invite-card-head">
        <UserPlus size={17} />
        <strong>{t('invite.title')}</strong>
      </div>
      <label>
        {t('invite.emails')}
        <textarea
          value={emails}
          onChange={(event) => setEmails(event.target.value)}
          placeholder="ana@empresa.com, bruno@empresa.com"
          rows={3}
        />
      </label>
      <label>
        {t('invite.date')}
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
        />
      </label>
      <label>
        {t('invite.message')}
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t('invite.optional')}
          rows={2}
        />
      </label>
      <button type="button" className="primary-action invite-submit" onClick={submit} disabled={busy}>
        <CalendarClock size={16} />
        {busy ? t('invite.sending') : t('invite.send')}
      </button>
      {status ? <p className="panel-status">{status}</p> : null}
      {invitations.length > 0 ? (
        <ul className="invite-list">
          {invitations.slice(0, 6).map((invitation) => (
            <li key={invitation.id}>
              <span>{invitation.email}</span>
              <strong className={`invite-status is-${invitation.deliveryStatus}`}>
                {formatInvitationStatus(t, invitation)}
              </strong>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function getModerationStatus(t: Translate, action: 'mute' | 'remove' | 'block-chat' | 'unblock-chat', muted?: boolean): string {
  if (action === 'mute') {
    return muted ? t('moderation.muted') : t('moderation.micNotPublished');
  }
  if (action === 'remove') {
    return t('moderation.removed');
  }
  if (action === 'block-chat') {
    return t('moderation.blocked');
  }
  return t('moderation.unblocked');
}

function formatInvitationStatus(t: Translate, invitation: RoomInvitation): string {
  if (invitation.deliveryStatus === 'sent') {
    return t('invite.statusSent');
  }
  if (invitation.deliveryStatus === 'failed') {
    return t('invite.statusFailed');
  }
  return t('invite.statusPending');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

async function ensureLocalCameraPublication(localParticipant: ReturnType<typeof useLocalParticipant>['localParticipant']) {
  let publication = localParticipant.getTrackPublication(Track.Source.Camera);
  if (publication?.videoTrack) {
    return publication;
  }

  await localParticipant.setCameraEnabled(true);
  publication = localParticipant.getTrackPublication(Track.Source.Camera);
  return publication;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
