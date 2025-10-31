import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const API_AUTH = 'https://functions.poehali.dev/74f14d11-9b10-45b5-b010-c9f77abaee73';
const API_POSTS = 'https://functions.poehali.dev/198e8691-66af-4852-af3d-c006a6afe8f1';
const API_COMMUNITIES = 'https://functions.poehali.dev/8eafc739-e45c-4a2b-9aaf-759dfd6bdf28';

const Index = () => {
  const [activeSection, setActiveSection] = useState('feed');
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [newPostContent, setNewPostContent] = useState('');
  const [currentRadioStation, setCurrentRadioStation] = useState<number | null>(null);

  const radioStations = [
    { id: 1, name: 'Rock FM', genre: 'Rock', listeners: 1234 },
    { id: 2, name: 'Electronic Beats', genre: 'Electronic', listeners: 2156 },
    { id: 3, name: 'Hip-Hop Nation', genre: 'Hip-Hop', listeners: 1890 },
    { id: 4, name: 'Jazz Lounge', genre: 'Jazz', listeners: 876 }
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadPosts();
      loadCommunities();
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
                onClick={() => setActiveSection(section)}
              >
                <Icon 
                  name={
                    section === 'feed' ? 'Home' :
                    section === 'communities' ? 'Users' :
                    section === 'music' ? 'Music' :
                    section === 'radio' ? 'Radio' :
                    section === 'messages' ? 'MessageCircle' : 'User'
                  } 
                  size={20} 
                />
                {section === 'feed' && 'Лента'}
                {section === 'communities' && 'Группы'}
                {section === 'music' && 'Музыка'}
                {section === 'radio' && 'Радио'}
                {section === 'messages' && 'Чаты'}
                {section === 'profile' && 'Профиль'}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="text-yellow-500 hover:bg-yellow-500 hover:text-black relative">
              <Icon name="Bell" size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </Button>
            <Avatar className="border-2 border-yellow-500 cursor-pointer hover:scale-105 transition-transform">
              <AvatarFallback className="bg-yellow-500 text-black font-bold">
                {user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout}
              className="text-yellow-500 hover:bg-yellow-500 hover:text-black"
            >
              <Icon name="LogOut" size={20} />
            </Button>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {['feed', 'communities', 'music', 'radio', 'messages', 'profile'].map((section) => (
              <Button
                key={section}
                size="sm"
                variant={activeSection === section ? 'default' : 'outline'}
                onClick={() => setActiveSection(section)}
                className={`whitespace-nowrap ${
                  activeSection === section 
                    ? 'bg-yellow-500 text-black' 
                    : 'border-yellow-500 text-yellow-500'
                }`}
              >
                {section === 'feed' && 'Лента'}
                {section === 'communities' && 'Группы'}
                {section === 'music' && 'Музыка'}
                {section === 'radio' && 'Радио'}
                {section === 'messages' && 'Чаты'}
                {section === 'profile' && 'Профиль'}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 space-y-4">
            <Card className="p-4 bg-black border-2 border-yellow-500">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-16 h-16 border-2 border-yellow-500">
                  <AvatarFallback className="bg-yellow-500 text-black font-bold text-xl">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-yellow-500">{user?.full_name || user?.username}</h3>
                  <p className="text-sm text-gray-400">@{user?.username}</p>
                  {user?.is_admin && (
                    <p className="text-xs text-blue-400 font-bold">АДМИНИСТРАТОР</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-bold text-yellow-500">0</p>
                  <p className="text-xs text-gray-400">Друзья</p>
                </div>
                <div>
                  <p className="font-bold text-blue-400">0</p>
                  <p className="text-xs text-gray-400">Группы</p>
                </div>
                <div>
                  <p className="font-bold text-white">0</p>
                  <p className="text-xs text-gray-400">Посты</p>
                </div>
              </div>
            </Card>

            {user?.is_admin && (
              <Card className="p-4 bg-blue-500 border-2 border-blue-400 text-white">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Shield" size={18} />
                  Панель админа
                </h3>
                <p className="text-sm text-blue-100 mb-3">У вас есть полный доступ к управлению</p>
                <Button variant="secondary" size="sm" className="w-full bg-white text-blue-500">
                  Управление
                </Button>
              </Card>
            )}

            <Card className="p-4 bg-black border-2 border-yellow-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-500">
                <Icon name="TrendingUp" size={18} />
                Тренды
              </h3>
              <div className="space-y-3">
                {['#святаямолодёжь', '#музыка2025', '#радиоволны'].map((trend, idx) => (
                  <div key={idx} className="cursor-pointer hover:bg-gray-900 p-2 rounded-lg transition-colors">
                    <p className="font-medium text-yellow-500">{trend}</p>
                    <p className="text-xs text-gray-400">{Math.floor(Math.random() * 50 + 10)}K постов</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>

          <main className="lg:col-span-6 space-y-4">
            {activeSection === 'feed' && (
              <div className="space-y-4">
                <Card className="p-4 bg-black border-2 border-yellow-500">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-yellow-500 text-black font-bold">
                        {user?.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Input
                      placeholder="Что нового?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="flex-1 bg-gray-900 border-yellow-500 text-white"
                    />
                    <Button 
                      onClick={createPost}
                      className="bg-yellow-500 text-black hover:bg-yellow-400"
                    >
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </Card>

                {posts.length === 0 ? (
                  <Card className="p-8 bg-black border-2 border-yellow-500 text-center">
                    <Icon name="MessageSquare" size={48} className="text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-yellow-500 mb-2">Пока нет постов</h3>
                    <p className="text-gray-400">Будьте первым, кто создаст пост!</p>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="p-5 bg-black border-2 border-yellow-500 hover:border-white transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar>
                          <AvatarFallback className="bg-yellow-500 text-black font-bold">
                            {post.author?.username?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-500">{post.author?.full_name || post.author?.username}</h4>
                          <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>

                      <p className="mb-4 text-white">{post.content}</p>

                      <div className="flex items-center gap-6 pt-3 border-t border-gray-800">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-gray-400 hover:text-yellow-500"
                          onClick={() => likePost(post.id)}
                        >
                          <Icon name="Heart" size={18} />
                          <span>{post.likes_count || 0}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-blue-400">
                          <Icon name="MessageCircle" size={18} />
                          <span>{post.comments_count || 0}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-white">
                          <Icon name="Share2" size={18} />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeSection === 'communities' && (
              <div className="space-y-4">
                <Card className="p-4 bg-black border-2 border-yellow-500">
                  <Input
                    placeholder="Поиск сообществ..."
                    className="bg-gray-900 border-yellow-500 text-white"
                  />
                </Card>

                {communities.length === 0 ? (
                  <Card className="p-8 bg-black border-2 border-yellow-500 text-center">
                    <Icon name="Users" size={48} className="text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-yellow-500 mb-2">Пока нет сообществ</h3>
                    <p className="text-gray-400">Создайте первое сообщество!</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {communities.map((community, idx) => (
                      <Card key={idx} className="p-5 bg-black border-2 border-yellow-500 hover:border-blue-400 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center">
                            <Icon name="Users" size={28} className="text-black" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-yellow-500">{community.name}</h3>
                            <p className="text-sm text-gray-400">{community.members_count} участников</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => joinCommunity(community.id)}
                          className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
                          disabled={community.is_member}
                        >
                          {community.is_member ? 'Состоите' : 'Вступить'}
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'radio' && (
              <div className="space-y-4">
                <Card className="p-6 bg-yellow-500 text-black border-2 border-yellow-400">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                      <Icon name="Radio" size={36} className="text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Радио онлайн</h2>
                      <p className="text-gray-800">Слушай любимые станции 24/7</p>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  {radioStations.map((station) => (
                    <Card 
                      key={station.id} 
                      className={`p-5 bg-black border-2 transition-all cursor-pointer ${
                        currentRadioStation === station.id 
                          ? 'border-blue-400 bg-gray-900' 
                          : 'border-yellow-500 hover:border-white'
                      }`}
                      onClick={() => setCurrentRadioStation(station.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Button 
                          size="icon" 
                          className={`${
                            currentRadioStation === station.id 
                              ? 'bg-blue-400 hover:bg-blue-500' 
                              : 'bg-yellow-500 hover:bg-yellow-400'
                          } text-black`}
                        >
                          <Icon name={currentRadioStation === station.id ? "Pause" : "Play"} size={20} />
                        </Button>
                        <div className="flex-1">
                          <h4 className="font-bold text-yellow-500">{station.name}</h4>
                          <p className="text-sm text-gray-400">{station.genre}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Icon name="Users" size={14} />
                            {station.listeners}
                          </p>
                        </div>
                      </div>
                      {currentRadioStation === station.id && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <div className="flex items-center gap-2 text-blue-400 text-sm">
                            <Icon name="Radio" size={16} className="animate-pulse" />
                            <span>В эфире...</span>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'music' && (
              <Card className="p-8 bg-black border-2 border-yellow-500 text-center">
                <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Music" size={48} className="text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-yellow-500">Музыкальная библиотека</h3>
                <p className="text-gray-400 mb-4">Скоро здесь появятся треки и плейлисты</p>
              </Card>
            )}

            {activeSection === 'messages' && (
              <Card className="p-8 bg-black border-2 border-yellow-500 text-center">
                <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="MessageCircle" size={48} className="text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-yellow-500">Сообщения</h3>
                <p className="text-gray-400 mb-4">Общайся с друзьями в реальном времени</p>
                <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                  Начать чат
                </Button>
              </Card>
            )}

            {activeSection === 'profile' && (
              <Card className="p-8 bg-black border-2 border-yellow-500">
                <div className="text-center mb-6">
                  <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-yellow-500">
                    <AvatarFallback className="bg-yellow-500 text-black text-4xl font-bold">
                      {user?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-1 text-yellow-500">{user?.full_name || user?.username}</h2>
                  <p className="text-gray-400 mb-2">@{user?.username}</p>
                  {user?.is_admin && (
                    <p className="text-blue-400 font-bold mb-4">🛡️ АДМИНИСТРАТОР</p>
                  )}
                  <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                    Редактировать профиль
                  </Button>
                </div>

                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-yellow-500">
                    <TabsTrigger value="posts" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">Посты</TabsTrigger>
                    <TabsTrigger value="photos" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">Фото</TabsTrigger>
                    <TabsTrigger value="music" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">Музыка</TabsTrigger>
                  </TabsList>
                  <TabsContent value="posts" className="mt-4">
                    <p className="text-center text-gray-400 py-8">Ваши посты появятся здесь</p>
                  </TabsContent>
                  <TabsContent value="photos" className="mt-4">
                    <p className="text-center text-gray-400 py-8">Ваши фотографии появятся здесь</p>
                  </TabsContent>
                  <TabsContent value="music" className="mt-4">
                    <p className="text-center text-gray-400 py-8">Ваши плейлисты появятся здесь</p>
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </main>

          <aside className="lg:col-span-3 space-y-4">
            <Card className="p-4 bg-black border-2 border-yellow-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-500">
                <Icon name="Sparkles" size={18} />
                Статистика сети
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Пользователей</span>
                  <span className="text-yellow-500 font-bold">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Постов</span>
                  <span className="text-white font-bold">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Сообществ</span>
                  <span className="text-blue-400 font-bold">{communities.length}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-yellow-500 text-black border-2 border-yellow-400">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Icon name="Crown" size={18} />
                СМ Premium
              </h3>
              <p className="text-sm text-gray-800 mb-3">Получи эксклюзивные функции</p>
              <Button variant="secondary" size="sm" className="w-full bg-black text-yellow-500 hover:bg-gray-900">
                Узнать больше
              </Button>
            </Card>

            <Card className="p-4 bg-black border-2 border-blue-400">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-400">
                <Icon name="Radio" size={18} />
                Сейчас в эфире
              </h3>
              {currentRadioStation ? (
                <div className="p-3 bg-gray-900 rounded-lg">
                  <p className="font-medium text-sm text-yellow-500">
                    {radioStations.find(s => s.id === currentRadioStation)?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {radioStations.find(s => s.id === currentRadioStation)?.genre}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Выберите радиостанцию</p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
