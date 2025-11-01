import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import RadioPlayer from '@/components/RadioPlayer';

const API_AUTH = 'https://functions.poehali.dev/74f14d11-9b10-45b5-b010-c9f77abaee73';
const API_POSTS = 'https://functions.poehali.dev/198e8691-66af-4852-af3d-c006a6afe8f1';
const API_COMMUNITIES = 'https://functions.poehali.dev/8eafc739-e45c-4a2b-9aaf-759dfd6bdf28';
const API_FRIENDS = 'https://functions.poehali.dev/a76e8452-6446-4f93-80d8-e9b58b73d1f3';
const API_NOTIFICATIONS = 'https://functions.poehali.dev/ce61306a-ca64-4d83-8581-a10ab369b2d6';

const Index = () => {
  const [activeSection, setActiveSection] = useState('feed');
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [newPostContent, setNewPostContent] = useState('');
  const [currentRadioStation, setCurrentRadioStation] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [emailVisible, setEmailVisible] = useState(false);
  const [userCity, setUserCity] = useState('');
  const [userBirthDate, setUserBirthDate] = useState('');
  const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [viewingCommunityId, setViewingCommunityId] = useState<number | null>(null);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);

  const radioStations = [
    { id: 1, name: 'Русское Радио', genre: 'Поп', stream_url: 'http://rusradio.hostingradio.ru/rusradio96.aacp', listeners: 5432 },
    { id: 2, name: 'Европа Плюс', genre: 'Хиты', stream_url: 'http://ep128.hostingradio.ru:8030/ep128', listeners: 4321 },
    { id: 3, name: 'Дорожное Радио', genre: 'Рок', stream_url: 'http://dor.hostingradio.ru:8000/dor', listeners: 3210 },
    { id: 4, name: 'Ретро FM', genre: 'Ретро', stream_url: 'http://retroserver.hostingradio.ru:8043/retro', listeners: 2987 }
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedLikedPosts = localStorage.getItem('likedPosts');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setUserCity(userData.city || '');
      setUserBirthDate(userData.birth_date || '');
      setEmailVisible(userData.email_visible || false);
      loadPosts();
      loadCommunities();
      loadFriends();
      loadNotifications();
      loadPlaylists();
      if (userData.phone === '+79270011297') {
        loadAdminRequests();
      }
    } else {
      setIsAuthOpen(true);
    }
    if (savedLikedPosts) {
      setLikedPosts(JSON.parse(savedLikedPosts));
    }
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch(API_POSTS);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const loadCommunities = async () => {
    try {
      const response = await fetch(API_COMMUNITIES);
      const data = await response.json();
      setCommunities(data.communities || []);
    } catch (error) {
      console.error('Failed to load communities:', error);
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_FRIENDS}?user_id=${user.id}`);
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_NOTIFICATIONS}?user_id=${user.id}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications?.filter((n: any) => !n.is_read).length || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`${API_FRIENDS}?action=search&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const addFriend = async (targetId: number) => {
    if (!user) return;
    try {
      const response = await fetch(API_FRIENDS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          user_id: user.id,
          target_id: targetId
        })
      });
      if (response.ok) {
        loadFriends();
        loadNotifications();
      }
    } catch (error) {
      console.error('Failed to add friend:', error);
    }
  };

  const removeFriend = async (targetId: number) => {
    if (!user) return;
    try {
      const response = await fetch(API_FRIENDS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          user_id: user.id,
          target_id: targetId
        })
      });
      if (response.ok) {
        loadFriends();
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const markNotificationsRead = async () => {
    if (!user) return;
    try {
      await fetch(API_NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          user_id: user.id
        })
      });
      setUnreadCount(0);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const viewUserProfile = (userId: number) => {
    setViewingUserId(userId);
    setActiveSection('profile');
  };

  const checkFriendship = (targetId: number): boolean => {
    return friends.some(friend => friend.id === targetId);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+7|\+1)\d{10,11}$/;
    return phoneRegex.test(phone);
  };

  const validateBirthYear = (birthDate: string): boolean => {
    const year = new Date(birthDate).getFullYear();
    return year >= 2000;
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    
    if (authMode === 'register') {
      if (!validatePhone(phone)) {
        alert('Номер телефона должен начинаться с +7 или +1 и содержать 10-11 цифр');
        return;
      }
      
      const birthDate = formData.get('birth_date') as string;
      if (!validateBirthYear(birthDate)) {
        alert('Год рождения должен быть не раньше 2000');
        return;
      }
    }
    
    try {
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          username: phone,
          phone,
          password,
          email: authMode === 'register' ? formData.get('email') : undefined,
          full_name: authMode === 'register' ? formData.get('full_name') : undefined,
          birth_date: authMode === 'register' ? formData.get('birth_date') : undefined,
          city: authMode === 'register' ? formData.get('city') : undefined,
          is_admin: authMode === 'register' && phone === 'admin'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setIsAuthOpen(false);
        loadPosts();
        loadCommunities();
        loadFriends();
        loadNotifications();
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Network error');
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !user) return;
    
    try {
      const response = await fetch(API_POSTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          user_id: user.id,
          content: newPostContent
        })
      });
      
      if (response.ok) {
        setNewPostContent('');
        loadPosts();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const likePost = async (postId: number) => {
    if (!user || likedPosts.includes(postId)) return;
    
    try {
      await fetch(API_POSTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          post_id: postId,
          user_id: user.id
        })
      });
      const newLikedPosts = [...likedPosts, postId];
      setLikedPosts(newLikedPosts);
      localStorage.setItem('likedPosts', JSON.stringify(newLikedPosts));
      loadPosts();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const joinCommunity = async (communityId: number) => {
    if (!user) return;
    
    try {
      await fetch(API_COMMUNITIES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          community_id: communityId,
          user_id: user.id
        })
      });
      loadCommunities();
    } catch (error) {
      console.error('Failed to join community:', error);
    }
  };

  const leaveCommunity = async (communityId: number) => {
    if (!user) return;
    
    try {
      await fetch(API_COMMUNITIES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave',
          community_id: communityId,
          user_id: user.id
        })
      });
      loadCommunities();
    } catch (error) {
      console.error('Failed to leave community:', error);
    }
  };

  const createCommunity = async () => {
    if (!user) return;
    const name = prompt('Название группы:');
    const description = prompt('Описание группы:');
    
    if (!name || !description) return;
    
    try {
      await fetch(API_COMMUNITIES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name,
          description,
          creator_id: user.id
        })
      });
      loadCommunities();
    } catch (error) {
      console.error('Failed to create community:', error);
    }
  };

  const updateSettings = async () => {
    if (!user) return;
    
    try {
      const updatedUser = { 
        ...user, 
        email_visible: emailVisible,
        city: userCity,
        birth_date: userBirthDate
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Настройки сохранены');
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsAuthOpen(true);
    setFriends([]);
    setNotifications([]);
    setUnreadCount(0);
    setSearchResults([]);
    setViewingUserId(null);
  };

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      try {
        const response = await fetch(API_AUTH, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload_avatar',
            user_id: user.id,
            file: base64
          })
        });
        
        const data = await response.json();
        if (data.success) {
          const updatedUser = { ...user, avatar_url: data.url };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setIsAvatarUploadOpen(false);
          alert('Аватар загружен!');
        }
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        alert('Ошибка загрузки аватара');
      }
    };
    reader.readAsDataURL(file);
  };

  const loadPlaylists = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_POSTS}?user_id=${user.id}&type=playlists`);
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const createPlaylist = async () => {
    if (!user || !newPlaylistName) return;
    
    try {
      const response = await fetch(API_POSTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_playlist',
          user_id: user.id,
          name: newPlaylistName,
          description: ''
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setNewPlaylistName('');
        setIsCreatePlaylistOpen(false);
        loadPlaylists();
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  const loadAdminRequests = async () => {
    if (!user || user.phone !== '+79270011297') return;
    
    try {
      const response = await fetch(API_NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_admin_requests',
          admin_phone: user.phone
        })
      });
      
      const data = await response.json();
      setAdminRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load admin requests:', error);
    }
  };

  const resolveAdminRequest = async (requestId: number, decision: string) => {
    if (!user || user.phone !== '+79270011297') return;
    
    try {
      await fetch(API_NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_admin_request',
          admin_phone: user.phone,
          request_id: requestId,
          decision
        })
      });
      
      loadAdminRequests();
    } catch (error) {
      console.error('Failed to resolve request:', error);
    }
  };

  const viewCommunityPosts = async (communityId: number) => {
    setViewingCommunityId(communityId);
    try {
      const response = await fetch(`${API_COMMUNITIES}?action=get_posts&community_id=${communityId}`);
      const data = await response.json();
      setCommunityPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load community posts:', error);
    }
  };

  if (!user) {
    return (
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="bg-black border-2 border-yellow-500">
          <DialogHeader>
            <DialogTitle className="text-yellow-500 text-2xl">
              {authMode === 'login' ? 'Вход' : 'Регистрация'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <Label htmlFor="full_name" className="text-yellow-500">Имя *</Label>
                  <Input id="full_name" name="full_name" required className="bg-gray-900 border-yellow-500 text-white" />
                </div>
                <div>
                  <Label htmlFor="birth_date" className="text-yellow-500">Дата рождения * (мин. 2000 год)</Label>
                  <Input id="birth_date" name="birth_date" type="date" required className="bg-gray-900 border-yellow-500 text-white" />
                </div>
                <div>
                  <Label htmlFor="city" className="text-yellow-500">Город</Label>
                  <Input id="city" name="city" className="bg-gray-900 border-yellow-500 text-white" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-yellow-500">Email (необязательно)</Label>
                  <Input id="email" name="email" type="email" className="bg-gray-900 border-yellow-500 text-white" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="phone" className="text-yellow-500">Телефон * (+7 или +1)</Label>
              <Input 
                id="phone" 
                name="phone" 
                required 
                placeholder="+79991234567"
                className="bg-gray-900 border-yellow-500 text-white" 
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-yellow-500">Пароль *</Label>
              <Input id="password" name="password" type="password" required className="bg-gray-900 border-yellow-500 text-white" />
            </div>
            <Button type="submit" className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-yellow-500"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            >
              {authMode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  const displayUser = viewingUserId 
    ? searchResults.find(u => u.id === viewingUserId) || friends.find(f => f.id === viewingUserId)
    : user;

  const popularCommunities = communities
    .sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
    .slice(0, 3);

  const menuItems = [
    { id: 'feed', label: 'Лента' },
    { id: 'friends', label: 'Друзья' },
    { id: 'search', label: 'Поиск' },
    { id: 'messages', label: 'Сообщения' },
    { id: 'communities', label: 'Группы' },
    { id: 'music', label: 'Музыка' },
    { id: 'radio', label: 'Радио' },
    { id: 'profile', label: 'Профиль' },
    { id: 'settings', label: 'Настройки' }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-black border-b-2 border-yellow-500">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="md:hidden text-yellow-500 hover:bg-yellow-500 hover:text-black"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-2xl">СМ</span>
            </div>
            <h1 className="text-2xl font-bold text-yellow-500">
              Святая Молодёжь
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative text-yellow-500 hover:bg-yellow-500 hover:text-black">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black border-2 border-yellow-500 w-80">
                <div className="p-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-yellow-500 font-bold">Уведомления</span>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-yellow-500 text-xs"
                        onClick={markNotificationsRead}
                      >
                        Прочитать все
                      </Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-gray-500 text-sm p-4 text-center">
                      Нет уведомлений
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <DropdownMenuItem 
                          key={notif.id} 
                          className={`cursor-pointer ${!notif.is_read ? 'bg-gray-900' : ''} text-white hover:bg-yellow-500 hover:text-black`}
                        >
                          <div className="flex-1">
                            <p className="text-sm">{notif.message}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(notif.created_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" className="text-yellow-500 hover:bg-yellow-500 hover:text-black" onClick={logout}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar Menu */}
          <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-0 left-0 w-64 h-screen md:h-auto bg-black z-40 md:z-0 border-r-2 border-yellow-500 md:border-r-0`}>
            <Card className="p-4 bg-black border-2 border-yellow-500">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start text-yellow-500 hover:bg-yellow-500 hover:text-black ${
                      activeSection === item.id ? 'bg-yellow-500 text-black' : ''
                    }`}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileMenuOpen(false);
                      if (item.id !== 'profile') {
                        setViewingUserId(null);
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
            </Card>

            {/* User Stats */}
            <Card className="p-6 bg-black border-2 border-yellow-500 mt-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 border-2 border-yellow-500">
                  <AvatarFallback className="bg-yellow-500 text-black text-2xl">
                    {user.full_name?.charAt(0) || user.phone?.charAt(2)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold text-yellow-500">{user.full_name}</h2>
                <p className="text-gray-400">{user.phone}</p>
                <div className="flex gap-4 mt-4 w-full">
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{friends.length}</p>
                    <p className="text-xs text-gray-400">Друзей</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{posts.filter(p => p.user_id === user.id).length}</p>
                    <p className="text-xs text-gray-400">Постов</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Popular Groups */}
            <Card className="p-4 bg-black border-2 border-yellow-500 mt-4">
              <h3 className="font-bold text-yellow-500 mb-3">Популярные группы</h3>
              {popularCommunities.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет групп</p>
              ) : (
                popularCommunities.map(community => (
                  <div key={community.id} className="mb-3 last:mb-0">
                    <p className="text-white font-medium">{community.name}</p>
                    <p className="text-xs text-gray-400">{community.members_count || 0} участников</p>
                  </div>
                ))
              )}
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Feed Section */}
            {activeSection === 'feed' && (
              <div className="space-y-4">
                <Card className="p-4 bg-black border-2 border-yellow-500">
                  <Input
                    placeholder="Что нового?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mb-3 bg-gray-900 border-yellow-500 text-white"
                  />
                  <Button onClick={createPost} className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
                    Опубликовать
                  </Button>
                </Card>

                {posts.length === 0 ? (
                  <Card className="p-6 bg-black border-2 border-yellow-500">
                    <p className="text-gray-500 text-center">Нет постов</p>
                  </Card>
                ) : (
                  posts.map(post => (
                    <Card key={post.id} className="p-4 bg-black border-2 border-yellow-500">
                      <div className="flex gap-3">
                        <Avatar className="border-2 border-yellow-500">
                          <AvatarFallback className="bg-yellow-500 text-black">
                            {post.user_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-yellow-500">{post.user_name || 'Unknown User'}</h3>
                            <span className="text-gray-400 text-sm">
                              {new Date(post.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">{post.username || post.phone}</p>
                          <p className="text-white mt-2">{post.content}</p>
                          <div className="flex gap-4 mt-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-yellow-500 hover:bg-yellow-500 hover:text-black"
                              onClick={() => likePost(post.id)}
                              disabled={likedPosts.includes(post.id)}
                            >
                              <svg className="w-4 h-4 mr-1" fill={likedPosts.includes(post.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {post.likes_count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-yellow-500 hover:bg-yellow-500 hover:text-black">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {post.comments_count || 0}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Friends Section */}
            {activeSection === 'friends' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Друзья</h2>
                {friends.length === 0 ? (
                  <Card className="p-6 bg-black border-2 border-yellow-500">
                    <p className="text-gray-500 text-center">У вас пока нет друзей</p>
                  </Card>
                ) : (
                  friends.map(friend => (
                    <Card 
                      key={friend.id} 
                      className="p-4 bg-black border-2 border-yellow-500 cursor-pointer hover:border-yellow-400"
                      onClick={() => viewUserProfile(friend.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="border-2 border-yellow-500">
                            <AvatarFallback className="bg-yellow-500 text-black">
                              {friend.full_name?.charAt(0) || friend.phone?.charAt(2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-yellow-500">{friend.full_name}</h3>
                            <p className="text-gray-400 text-sm">{friend.phone}</p>
                            {friend.city && <p className="text-gray-500 text-xs">{friend.city}</p>}
                          </div>
                        </div>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFriend(friend.id);
                          }}
                          className="bg-gray-700 text-white hover:bg-gray-600"
                        >
                          Удалить
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Search Section */}
            {activeSection === 'search' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Поиск пользователей</h2>
                <Card className="p-4 bg-black border-2 border-yellow-500">
                  <Input
                    placeholder="Поиск по имени, городу..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length > 2) {
                        searchUsers(e.target.value);
                      } else {
                        setSearchResults([]);
                      }
                    }}
                    className="bg-gray-900 border-yellow-500 text-white"
                  />
                </Card>
                {searchResults.length === 0 && searchQuery.length > 2 && (
                  <Card className="p-6 bg-black border-2 border-yellow-500">
                    <p className="text-gray-500 text-center">Ничего не найдено</p>
                  </Card>
                )}
                {searchResults.map(searchUser => (
                  <Card 
                    key={searchUser.id} 
                    className="p-4 bg-black border-2 border-yellow-500 cursor-pointer hover:border-yellow-400"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3" onClick={() => viewUserProfile(searchUser.id)}>
                        <Avatar className="border-2 border-yellow-500">
                          <AvatarFallback className="bg-yellow-500 text-black">
                            {searchUser.full_name?.charAt(0) || searchUser.phone?.charAt(2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-yellow-500">{searchUser.full_name}</h3>
                          <p className="text-gray-400 text-sm">{searchUser.phone}</p>
                          <div className="text-gray-500 text-xs mt-1">
                            {searchUser.city && <span>{searchUser.city}</span>}
                            {searchUser.birth_date && <span> • {calculateAge(searchUser.birth_date)} лет</span>}
                          </div>
                        </div>
                      </div>
                      {searchUser.id !== user.id && (
                        <Button 
                          onClick={() => {
                            if (checkFriendship(searchUser.id)) {
                              removeFriend(searchUser.id);
                            } else {
                              addFriend(searchUser.id);
                            }
                          }}
                          className={checkFriendship(searchUser.id) 
                            ? "bg-gray-700 text-white hover:bg-gray-600" 
                            : "bg-yellow-500 text-black hover:bg-yellow-400"
                          }
                        >
                          {checkFriendship(searchUser.id) ? 'Удалить из друзей' : 'Добавить в друзья'}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Messages Section */}
            {activeSection === 'messages' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Сообщения</h2>
                <Card className="p-6 bg-black border-2 border-yellow-500">
                  <p className="text-yellow-500 text-center text-lg">Сообщения будут доступны скоро</p>
                  <p className="text-gray-500 text-center mt-2">Функция в разработке</p>
                </Card>
              </div>
            )}

            {/* Communities Section */}
            {activeSection === 'communities' && (
              <div className="space-y-4">
                {viewingCommunityId ? (
                  <>
                    <Button 
                      onClick={() => setViewingCommunityId(null)}
                      variant="outline"
                      className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black mb-4"
                    >
                      ← Назад к группам
                    </Button>
                    <h2 className="text-2xl font-bold text-yellow-500 mb-4">Посты группы</h2>
                    {communityPosts.length === 0 ? (
                      <Card className="p-6 bg-black border-2 border-yellow-500">
                        <p className="text-gray-500 text-center">Нет постов в этой группе</p>
                      </Card>
                    ) : (
                      communityPosts.map(post => (
                        <Card key={post.id} className="p-4 bg-gray-900 border border-yellow-500">
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="w-8 h-8 border border-yellow-500">
                              <AvatarFallback className="bg-yellow-500 text-black text-xs">
                                {post.author?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-yellow-500 font-medium">{post.author?.full_name}</span>
                          </div>
                          <p className="text-white mb-2">{post.content}</p>
                          {post.image_url && (
                            <img src={post.image_url} alt="Post" className="rounded-lg w-full max-h-96 object-cover mb-2" />
                          )}
                          <p className="text-gray-400 text-sm">
                            {new Date(post.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </Card>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-yellow-500">Группы</h2>
                      <Button 
                        onClick={createCommunity}
                        className="bg-yellow-500 text-black hover:bg-yellow-400"
                      >
                        Создать группу
                      </Button>
                    </div>
                    {communities.length === 0 ? (
                      <Card className="p-6 bg-black border-2 border-yellow-500">
                        <p className="text-gray-500 text-center">Нет групп</p>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {communities.map(community => (
                          <Card 
                            key={community.id} 
                            className="p-6 bg-black border-2 border-yellow-500 cursor-pointer hover:border-yellow-400"
                            onClick={() => viewCommunityPosts(community.id)}
                          >
                            <h3 className="text-xl font-bold text-yellow-500 mb-2">{community.name}</h3>
                            <p className="text-gray-400 mb-4">{community.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">{community.members_count || 0} участников</span>
                              <div className="flex gap-2">
                                {community.is_member ? (
                                  <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      leaveCommunity(community.id);
                                    }}
                                    className="bg-gray-700 text-white hover:bg-gray-600"
                                  >
                                    Выйти
                                  </Button>
                                ) : (
                                  <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      joinCommunity(community.id);
                                    }}
                                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                                  >
                                    Вступить
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Music Section */}
            {activeSection === 'music' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-yellow-500">Музыка</h2>
                  <Button 
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                  >
                    Создать плейлист
                  </Button>
                </div>
                
                {playlists.length === 0 ? (
                  <Card className="p-6 bg-black border-2 border-yellow-500">
                    <p className="text-gray-500 text-center">Нет плейлистов</p>
                    <p className="text-gray-600 text-center text-sm mt-2">Создайте свой первый плейлист</p>
                  </Card>
                ) : (
                  playlists.map(playlist => (
                    <Card key={playlist.id} className="p-4 bg-gray-900 border border-yellow-500 cursor-pointer hover:border-yellow-400" onClick={() => setSelectedPlaylist(playlist)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-yellow-500">{playlist.name}</h3>
                          <p className="text-gray-400 text-sm mt-1">{playlist.track_count} треков</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Radio Section */}
            {activeSection === 'radio' && (
              <RadioPlayer 
                stations={radioStations} 
                currentStationId={currentRadioStation}
                onStationChange={setCurrentRadioStation}
              />
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-4">
                <Card className="p-6 bg-black border-2 border-yellow-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2 border-yellow-500 cursor-pointer" onClick={() => !viewingUserId && setIsAvatarUploadOpen(true)}>
                        {displayUser?.avatar_url ? (
                          <img src={displayUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-yellow-500 text-black text-3xl">
                            {displayUser?.full_name?.charAt(0) || displayUser?.phone?.charAt(2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {!viewingUserId && (
                        <div className="absolute bottom-0 right-0 bg-yellow-500 rounded-full p-1 cursor-pointer" onClick={() => setIsAvatarUploadOpen(true)}>
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-yellow-500">{displayUser?.full_name}</h2>
                      <p className="text-gray-400">{displayUser?.phone}</p>
                      {displayUser?.city && <p className="text-gray-500 mt-1">{displayUser.city}</p>}
                      {displayUser?.birth_date && (
                        <p className="text-gray-500">{calculateAge(displayUser.birth_date)} лет</p>
                      )}
                      {displayUser?.email && (emailVisible || viewingUserId) && (
                        <p className="text-gray-500 mt-2">{displayUser.email}</p>
                      )}
                    </div>
                    {viewingUserId && viewingUserId !== user.id && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            if (checkFriendship(viewingUserId)) {
                              removeFriend(viewingUserId);
                            } else {
                              addFriend(viewingUserId);
                            }
                          }}
                          className={checkFriendship(viewingUserId) 
                            ? "bg-gray-700 text-white hover:bg-gray-600" 
                            : "bg-yellow-500 text-black hover:bg-yellow-400"
                          }
                        >
                          {checkFriendship(viewingUserId) ? 'Удалить из друзей' : 'Добавить в друзья'}
                        </Button>
                        <Button 
                          onClick={() => {
                            setViewingUserId(null);
                          }}
                          variant="outline"
                          className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                        >
                          Назад к моему профилю
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-900">
                      <TabsTrigger value="posts" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-yellow-500">
                        Посты
                      </TabsTrigger>
                      <TabsTrigger value="friends" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-yellow-500">
                        Друзья
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="posts" className="mt-4 space-y-4">
                      {posts
                        .filter(post => post.user_id === (viewingUserId || user.id))
                        .length === 0 ? (
                          <Card className="p-6 bg-gray-900 border border-yellow-500">
                            <p className="text-gray-500 text-center">Нет постов</p>
                          </Card>
                        ) : (
                          posts
                            .filter(post => post.user_id === (viewingUserId || user.id))
                            .map(post => (
                              <Card key={post.id} className="p-4 bg-gray-900 border border-yellow-500">
                                <p className="text-white">{post.content}</p>
                                <p className="text-gray-400 text-sm mt-2">
                                  {new Date(post.created_at).toLocaleDateString('ru-RU')}
                                </p>
                                <div className="flex gap-4 mt-3">
                                  <span className="text-yellow-500 text-sm">
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {post.likes_count || 0}
                                  </span>
                                  <span className="text-yellow-500 text-sm">
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {post.comments_count || 0}
                                  </span>
                                </div>
                              </Card>
                            ))
                        )}
                    </TabsContent>
                    <TabsContent value="friends" className="mt-4 space-y-4">
                      {viewingUserId ? (
                        <p className="text-gray-400">Список друзей пользователя</p>
                      ) : (
                        friends.length === 0 ? (
                          <Card className="p-6 bg-gray-900 border border-yellow-500">
                            <p className="text-gray-500 text-center">Нет друзей</p>
                          </Card>
                        ) : (
                          friends.map(friend => (
                            <Card 
                              key={friend.id} 
                              className="p-4 bg-gray-900 border border-yellow-500 cursor-pointer hover:border-yellow-400"
                              onClick={() => viewUserProfile(friend.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="border-2 border-yellow-500">
                                  <AvatarFallback className="bg-yellow-500 text-black">
                                    {friend.full_name?.charAt(0) || friend.phone?.charAt(2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-bold text-yellow-500">{friend.full_name}</h3>
                                  <p className="text-gray-400 text-sm">{friend.phone}</p>
                                </div>
                              </div>
                            </Card>
                          ))
                        )
                      )}
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Настройки</h2>
                <Card className="p-6 bg-black border-2 border-yellow-500">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="settings-city" className="text-yellow-500">Город</Label>
                      <Input 
                        id="settings-city"
                        value={userCity}
                        onChange={(e) => setUserCity(e.target.value)}
                        className="bg-gray-900 border-yellow-500 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="settings-birth-date" className="text-yellow-500">Дата рождения</Label>
                      <Input 
                        id="settings-birth-date"
                        type="date"
                        value={userBirthDate}
                        onChange={(e) => setUserBirthDate(e.target.value)}
                        className="bg-gray-900 border-yellow-500 text-white mt-2"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-visible" className="text-yellow-500">Показывать email в профиле</Label>
                      <input
                        id="email-visible"
                        type="checkbox"
                        checked={emailVisible}
                        onChange={(e) => setEmailVisible(e.target.checked)}
                        className="w-5 h-5 bg-gray-900 border-yellow-500 rounded"
                      />
                    </div>
                    <Button 
                      onClick={updateSettings}
                      className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
                    >
                      Сохранить настройки
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarUploadOpen} onOpenChange={setIsAvatarUploadOpen}>
        <DialogContent className="bg-black border-2 border-yellow-500">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Загрузить аватар</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
              className="bg-gray-900 border-yellow-500 text-white"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Playlist Creation Dialog */}
      <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
        <DialogContent className="bg-black border-2 border-yellow-500">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Создать плейлист</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="playlist-name" className="text-yellow-500">Название плейлиста</Label>
              <Input 
                id="playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="bg-gray-900 border-yellow-500 text-white mt-2"
                placeholder="Мой плейлист"
              />
            </div>
            <Button 
              onClick={createPlaylist}
              className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
            >
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Requests Dialog */}
      {user?.phone === '+79270011297' && adminRequests.length > 0 && (
        <Dialog open={true} onOpenChange={() => setAdminRequests([])}>
          <DialogContent className="bg-black border-2 border-yellow-500">
            <DialogHeader>
              <DialogTitle className="text-yellow-500">Запросы на администратора</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {adminRequests.map(request => (
                <Card key={request.id} className="p-4 bg-gray-900 border border-yellow-500">
                  <p className="text-white mb-2">{request.full_name} ({request.phone})</p>
                  <p className="text-gray-400 text-sm mb-3">Это ваш аккаунт?</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => resolveAdminRequest(request.id, 'approve')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Подтвердить
                    </Button>
                    <Button 
                      onClick={() => resolveAdminRequest(request.id, 'reject')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Отклонить
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Index;