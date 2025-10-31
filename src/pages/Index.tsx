import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

  const radioStations = [
    { id: 1, name: 'Rock FM', genre: 'Rock', stream_url: 'http://stream.radioparadise.com/rock-320', listeners: 1234 },
    { id: 2, name: 'Electronic Beats', genre: 'Electronic', stream_url: 'http://stream.radioparadise.com/eclectic-320', listeners: 2156 },
    { id: 3, name: 'Hip-Hop Nation', genre: 'Hip-Hop', stream_url: 'http://stream.radioparadise.com/mellow-320', listeners: 1890 },
    { id: 4, name: 'Jazz Lounge', genre: 'Jazz', stream_url: 'http://stream.radioparadise.com/world-320', listeners: 876 }
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadPosts();
      loadCommunities();
      loadFriends();
      loadNotifications();
    } else {
      setIsAuthOpen(true);
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

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    try {
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          username,
          password,
          email: authMode === 'register' ? formData.get('email') : undefined,
          full_name: authMode === 'register' ? formData.get('full_name') : undefined,
          is_admin: authMode === 'register' && username === 'admin'
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
    if (!user) return;
    
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
                  <Label htmlFor="full_name" className="text-yellow-500">Имя</Label>
                  <Input id="full_name" name="full_name" required className="bg-gray-900 border-yellow-500 text-white" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-yellow-500">Email</Label>
                  <Input id="email" name="email" type="email" required className="bg-gray-900 border-yellow-500 text-white" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="username" className="text-yellow-500">Username</Label>
              <Input id="username" name="username" required className="bg-gray-900 border-yellow-500 text-white" />
            </div>
            <div>
              <Label htmlFor="password" className="text-yellow-500">Пароль</Label>
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

  return (
    <div className="min-h-screen bg-black">
      <nav className="sticky top-0 z-50 bg-black border-b-2 border-yellow-500">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-2xl">СМ</span>
            </div>
            <h1 className="text-2xl font-bold text-yellow-500">
              Святая Молодёжь
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {['feed', 'communities', 'music', 'radio', 'messages', 'profile'].map((section) => (
              <Button
                key={section}
                variant="ghost"
                className={`gap-2 text-yellow-500 hover:bg-yellow-500 hover:text-black ${
                  activeSection === section ? 'bg-yellow-500 text-black' : ''
                }`}
                onClick={() => {
                  setActiveSection(section);
                  if (section !== 'profile') {
                    setViewingUserId(null);
                  }
                }}
              >
                <Icon 
                  name={
                    section === 'feed' ? 'home' :
                    section === 'communities' ? 'users' :
                    section === 'music' ? 'music' :
                    section === 'radio' ? 'radio' :
                    section === 'messages' ? 'message-circle' : 'user'
                  } 
                  className="w-5 h-5"
                />
                {section === 'feed' ? 'Лента' :
                 section === 'communities' ? 'Группы' :
                 section === 'music' ? 'Музыка' :
                 section === 'radio' ? 'Радио' :
                 section === 'messages' ? 'Сообщения' : 'Профиль'}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative text-yellow-500 hover:bg-yellow-500 hover:text-black">
                  <Icon name="bell" className="w-5 h-5" />
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
              <Icon name="log-out" className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <Card className="p-6 bg-black border-2 border-yellow-500">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 border-2 border-yellow-500">
                  <AvatarFallback className="bg-yellow-500 text-black text-2xl">
                    {user.full_name?.charAt(0) || user.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold text-yellow-500">{user.full_name}</h2>
                <p className="text-gray-400">@{user.username}</p>
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

            <Card className="p-4 bg-black border-2 border-yellow-500">
              <h3 className="font-bold text-yellow-500 mb-3">Популярные группы</h3>
              {communities.slice(0, 3).map(community => (
                <div key={community.id} className="mb-3 last:mb-0">
                  <p className="text-white font-medium">{community.name}</p>
                  <p className="text-xs text-gray-400">{community.members_count} участников</p>
                </div>
              ))}
            </Card>
          </aside>

          <main className="lg:col-span-3">
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

                {posts.map(post => (
                  <Card key={post.id} className="p-4 bg-black border-2 border-yellow-500">
                    <div className="flex gap-3">
                      <Avatar className="border-2 border-yellow-500">
                        <AvatarFallback className="bg-yellow-500 text-black">
                          {post.user_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-yellow-500">{post.user_name}</h3>
                          <span className="text-gray-400 text-sm">
                            {new Date(post.created_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-white mt-2">{post.content}</p>
                        <div className="flex gap-4 mt-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-yellow-500 hover:bg-yellow-500 hover:text-black"
                            onClick={() => likePost(post.id)}
                          >
                            <Icon name="heart" className="w-4 h-4 mr-1" />
                            {post.likes_count || 0}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-yellow-500 hover:bg-yellow-500 hover:text-black">
                            <Icon name="message-circle" className="w-4 h-4 mr-1" />
                            {post.comments_count || 0}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeSection === 'communities' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Группы</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {communities.map(community => (
                    <Card key={community.id} className="p-6 bg-black border-2 border-yellow-500">
                      <h3 className="text-xl font-bold text-yellow-500 mb-2">{community.name}</h3>
                      <p className="text-gray-400 mb-4">{community.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{community.members_count} участников</span>
                        <Button 
                          onClick={() => joinCommunity(community.id)}
                          className="bg-yellow-500 text-black hover:bg-yellow-400"
                        >
                          Вступить
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'music' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Музыка</h2>
                <Card className="p-6 bg-black border-2 border-yellow-500">
                  <p className="text-yellow-500">Раздел в разработке</p>
                </Card>
              </div>
            )}

            {activeSection === 'radio' && (
              <RadioPlayer 
                stations={radioStations} 
                currentStationId={currentRadioStation}
                onStationChange={setCurrentRadioStation}
              />
            )}

            {activeSection === 'messages' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Поиск пользователей</h2>
                <Card className="p-4 bg-black border-2 border-yellow-500">
                  <Input
                    placeholder="Поиск пользователей..."
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
                {searchResults.map(searchUser => (
                  <Card 
                    key={searchUser.id} 
                    className="p-4 bg-black border-2 border-yellow-500 cursor-pointer hover:border-yellow-400"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3" onClick={() => viewUserProfile(searchUser.id)}>
                        <Avatar className="border-2 border-yellow-500">
                          <AvatarFallback className="bg-yellow-500 text-black">
                            {searchUser.full_name?.charAt(0) || searchUser.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-yellow-500">{searchUser.full_name}</h3>
                          <p className="text-gray-400 text-sm">@{searchUser.username}</p>
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

            {activeSection === 'profile' && (
              <div className="space-y-4">
                <Card className="p-6 bg-black border-2 border-yellow-500">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-24 h-24 border-2 border-yellow-500">
                      <AvatarFallback className="bg-yellow-500 text-black text-3xl">
                        {displayUser?.full_name?.charAt(0) || displayUser?.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-yellow-500">{displayUser?.full_name}</h2>
                      <p className="text-gray-400">@{displayUser?.username}</p>
                      <p className="text-gray-500 mt-2">{displayUser?.email}</p>
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
                        .map(post => (
                          <Card key={post.id} className="p-4 bg-gray-900 border border-yellow-500">
                            <p className="text-white">{post.content}</p>
                            <p className="text-gray-400 text-sm mt-2">
                              {new Date(post.created_at).toLocaleDateString('ru-RU')}
                            </p>
                            <div className="flex gap-4 mt-3">
                              <span className="text-yellow-500 text-sm">
                                <Icon name="heart" className="w-4 h-4 inline mr-1" />
                                {post.likes_count || 0}
                              </span>
                              <span className="text-yellow-500 text-sm">
                                <Icon name="message-circle" className="w-4 h-4 inline mr-1" />
                                {post.comments_count || 0}
                              </span>
                            </div>
                          </Card>
                        ))}
                    </TabsContent>
                    <TabsContent value="friends" className="mt-4 space-y-4">
                      {viewingUserId ? (
                        <p className="text-gray-400">Список друзей пользователя</p>
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
                                  {friend.full_name?.charAt(0) || friend.username?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-bold text-yellow-500">{friend.full_name}</h3>
                                <p className="text-gray-400 text-sm">@{friend.username}</p>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
