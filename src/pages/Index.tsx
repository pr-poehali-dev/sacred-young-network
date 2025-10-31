import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [activeSection, setActiveSection] = useState('feed');

  const posts = [
    {
      id: 1,
      author: 'Мария К.',
      avatar: 'МК',
      time: '15 минут назад',
      content: 'Вчера была на концерте! Эмоции зашкаливают 🎵',
      likes: 42,
      comments: 8,
      image: true
    },
    {
      id: 2,
      author: 'Артём Л.',
      avatar: 'АЛ',
      time: '2 часа назад',
      content: 'Создал новый плейлист для вечернего чилла. Кто хочет послушать?',
      likes: 156,
      comments: 23
    },
    {
      id: 3,
      author: 'София Н.',
      avatar: 'СН',
      time: '5 часов назад',
      content: 'Присоединяйтесь к нашему сообществу любителей рока!',
      likes: 89,
      comments: 15,
      community: 'Рок Движение'
    }
  ];

  const communities = [
    { name: 'Рок Движение', members: '12.5K', color: 'bg-purple-500' },
    { name: 'Электронная музыка', members: '8.2K', color: 'bg-pink-500' },
    { name: 'Фотографы', members: '15.8K', color: 'bg-orange-500' },
    { name: 'Киноманы', members: '9.1K', color: 'bg-blue-500' }
  ];

  const friends = [
    { name: 'Алексей П.', status: 'online', avatar: 'АП' },
    { name: 'Дарья М.', status: 'online', avatar: 'ДМ' },
    { name: 'Игорь В.', status: 'offline', avatar: 'ИВ' },
    { name: 'Елена С.', status: 'online', avatar: 'ЕС' }
  ];

  const musicTracks = [
    { title: 'Summer Vibes', artist: 'DJ Fresh', duration: '3:45' },
    { title: 'Night City', artist: 'Electric Dreams', duration: '4:12' },
    { title: 'Sunset Boulevard', artist: 'The Waves', duration: '3:28' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">С</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Святая Молодёжь
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Button
              variant="ghost"
              className={`gap-2 ${activeSection === 'feed' ? 'text-purple-600 bg-purple-50' : ''}`}
              onClick={() => setActiveSection('feed')}
            >
              <Icon name="Home" size={20} />
              Лента
            </Button>
            <Button
              variant="ghost"
              className={`gap-2 ${activeSection === 'communities' ? 'text-purple-600 bg-purple-50' : ''}`}
              onClick={() => setActiveSection('communities')}
            >
              <Icon name="Users" size={20} />
              Сообщества
            </Button>
            <Button
              variant="ghost"
              className={`gap-2 ${activeSection === 'music' ? 'text-purple-600 bg-purple-50' : ''}`}
              onClick={() => setActiveSection('music')}
            >
              <Icon name="Music" size={20} />
              Музыка
            </Button>
            <Button
              variant="ghost"
              className={`gap-2 ${activeSection === 'messages' ? 'text-purple-600 bg-purple-50' : ''}`}
              onClick={() => setActiveSection('messages')}
            >
              <Icon name="MessageCircle" size={20} />
              Сообщения
            </Button>
            <Button
              variant="ghost"
              className={`gap-2 ${activeSection === 'profile' ? 'text-purple-600 bg-purple-50' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <Icon name="User" size={20} />
              Профиль
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="relative">
              <Icon name="Bell" size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
            </Button>
            <Avatar className="border-2 border-purple-300 cursor-pointer hover:scale-105 transition-transform">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">ВЫ</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {['feed', 'communities', 'music', 'messages', 'profile'].map((section) => (
              <Button
                key={section}
                size="sm"
                variant={activeSection === section ? 'default' : 'outline'}
                onClick={() => setActiveSection(section)}
                className="whitespace-nowrap"
              >
                {section === 'feed' && 'Лента'}
                {section === 'communities' && 'Группы'}
                {section === 'music' && 'Музыка'}
                {section === 'messages' && 'Чаты'}
                {section === 'profile' && 'Профиль'}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 space-y-4 animate-fade-in">
            <Card className="p-4 border-purple-200 shadow-md hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-16 h-16 border-2 border-purple-300">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg">ВЫ</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">Ваш профиль</h3>
                  <p className="text-sm text-muted-foreground">@username</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-bold text-purple-600">156</p>
                  <p className="text-xs text-muted-foreground">Друзья</p>
                </div>
                <div>
                  <p className="font-bold text-pink-600">23</p>
                  <p className="text-xs text-muted-foreground">Группы</p>
                </div>
                <div>
                  <p className="font-bold text-orange-600">89</p>
                  <p className="text-xs text-muted-foreground">Посты</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-purple-200 shadow-md">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="Users" size={18} className="text-purple-600" />
                Друзья онлайн
              </h3>
              <div className="space-y-3">
                {friends.map((friend, idx) => (
                  <div key={idx} className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-300 to-pink-300">{friend.avatar}</AvatarFallback>
                      </Avatar>
                      {friend.status === 'online' && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{friend.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>

          <main className="lg:col-span-6 space-y-4">
            {activeSection === 'feed' && (
              <div className="space-y-4 animate-fade-in">
                <Card className="p-4 border-purple-200 shadow-md">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">ВЫ</AvatarFallback>
                    </Avatar>
                    <Input
                      placeholder="Что нового, друзья?"
                      className="flex-1 border-purple-200 focus:border-purple-400"
                    />
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </Card>

                {posts.map((post) => (
                  <Card key={post.id} className="p-5 border-purple-200 shadow-md hover:shadow-xl transition-all hover:scale-[1.02] animate-scale-in">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-purple-300 to-pink-300">{post.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{post.author}</h4>
                        <p className="text-xs text-muted-foreground">{post.time}</p>
                      </div>
                      {post.community && (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                          {post.community}
                        </Badge>
                      )}
                    </div>

                    <p className="mb-4 text-gray-700">{post.content}</p>

                    {post.image && (
                      <div className="mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200 h-64 flex items-center justify-center">
                        <Icon name="Image" size={48} className="text-purple-400" />
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-3 border-t border-purple-100">
                      <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-pink-600">
                        <Icon name="Heart" size={18} />
                        <span>{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-purple-600">
                        <Icon name="MessageCircle" size={18} />
                        <span>{post.comments}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-orange-600">
                        <Icon name="Share2" size={18} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeSection === 'communities' && (
              <div className="space-y-4 animate-fade-in">
                <Card className="p-4 border-purple-200 shadow-md">
                  <Input
                    placeholder="Поиск сообществ..."
                    className="border-purple-200"
                  />
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {communities.map((community, idx) => (
                    <Card key={idx} className="p-5 border-purple-200 shadow-md hover:shadow-xl transition-all hover:scale-[1.02]">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 ${community.color} rounded-2xl flex items-center justify-center`}>
                          <Icon name="Users" size={28} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{community.name}</h3>
                          <p className="text-sm text-muted-foreground">{community.members} участников</p>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        Вступить
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'music' && (
              <div className="space-y-4 animate-fade-in">
                <Card className="p-6 border-purple-200 shadow-md bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <Icon name="Music" size={36} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Твоя музыка</h2>
                      <p className="text-purple-100">Слушай и делись треками</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-purple-200 shadow-md">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Icon name="TrendingUp" size={20} className="text-purple-600" />
                    Популярное сейчас
                  </h3>
                  <div className="space-y-3">
                    {musicTracks.map((track, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer group">
                        <Button size="icon" variant="ghost" className="bg-purple-100 hover:bg-purple-200 group-hover:scale-110 transition-transform">
                          <Icon name="Play" size={20} className="text-purple-600" />
                        </Button>
                        <div className="flex-1">
                          <h4 className="font-medium">{track.title}</h4>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{track.duration}</span>
                        <Button size="icon" variant="ghost">
                          <Icon name="Heart" size={18} className="text-gray-400 hover:text-pink-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeSection === 'messages' && (
              <Card className="p-8 border-purple-200 shadow-md text-center animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="MessageCircle" size={48} className="text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Сообщения</h3>
                <p className="text-muted-foreground mb-4">Общайся с друзьями в реальном времени</p>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Начать чат
                </Button>
              </Card>
            )}

            {activeSection === 'profile' && (
              <Card className="p-8 border-purple-200 shadow-md animate-fade-in">
                <div className="text-center mb-6">
                  <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-purple-300">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-4xl">ВЫ</AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-1">Ваше имя</h2>
                  <p className="text-muted-foreground mb-4">@username</p>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Редактировать профиль
                  </Button>
                </div>

                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Посты</TabsTrigger>
                    <TabsTrigger value="photos">Фото</TabsTrigger>
                    <TabsTrigger value="music">Музыка</TabsTrigger>
                  </TabsList>
                  <TabsContent value="posts" className="mt-4">
                    <p className="text-center text-muted-foreground py-8">Ваши посты появятся здесь</p>
                  </TabsContent>
                  <TabsContent value="photos" className="mt-4">
                    <p className="text-center text-muted-foreground py-8">Ваши фотографии появятся здесь</p>
                  </TabsContent>
                  <TabsContent value="music" className="mt-4">
                    <p className="text-center text-muted-foreground py-8">Ваши плейлисты появятся здесь</p>
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </main>

          <aside className="lg:col-span-3 space-y-4 animate-fade-in">
            <Card className="p-4 border-purple-200 shadow-md">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="TrendingUp" size={18} className="text-orange-600" />
                Тренды
              </h3>
              <div className="space-y-3">
                {['#летниевибрации', '#новаямузыка', '#концертнедели'].map((trend, idx) => (
                  <div key={idx} className="cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-colors">
                    <p className="font-medium text-purple-600">{trend}</p>
                    <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 50 + 10)}K постов</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-purple-200 shadow-md bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Icon name="Sparkles" size={18} />
                Святая Молодёжь Pro
              </h3>
              <p className="text-sm text-purple-100 mb-3">Получи доступ к эксклюзивным функциям</p>
              <Button variant="secondary" size="sm" className="w-full">
                Узнать больше
              </Button>
            </Card>

            <Card className="p-4 border-purple-200 shadow-md">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="Calendar" size={18} className="text-blue-600" />
                События
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-sm">Онлайн-концерт</p>
                  <p className="text-xs text-muted-foreground">Сегодня в 20:00</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-sm">Встреча фотографов</p>
                  <p className="text-xs text-muted-foreground">Завтра в 15:00</p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
