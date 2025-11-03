import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const AUTH_API = 'https://functions.poehali.dev/74f14d11-9b10-45b5-b010-c9f77abaee73';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Пароль должен содержать минимум 8 символов';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Пароль должен содержать заглавные буквы';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Пароль должен содержать строчные буквы';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Пароль должен содержать цифры';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        toast({
          title: 'Ошибка валидации',
          description: passwordError,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (!ageConfirmed) {
        toast({
          title: 'Ошибка',
          description: 'Необходимо подтвердить возраст и принять условия',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email,
          username: isLogin ? undefined : username,
          password,
          full_name: isLogin ? undefined : fullName,
          age_confirmed: isLogin ? undefined : ageConfirmed,
          terms_accepted: isLogin ? undefined : ageConfirmed
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        toast({
          title: 'Успешно!',
          description: isLogin ? 'Вы вошли в систему' : 'Регистрация завершена'
        });
        window.location.href = '/feed';
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Произошла ошибка',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-2 border-primary">
        <h1 className="text-4xl font-bold text-primary mb-2 text-center">
          {isLogin ? 'Вход' : 'Регистрация'}
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-card border-primary/30 text-foreground"
            />
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Имя пользователя</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-card border-primary/30 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Полное имя</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-card border-primary/30 text-foreground"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-card border-primary/30 text-foreground"
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground">
                Минимум 8 символов, заглавные и строчные буквы, цифры
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={ageConfirmed}
                onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-foreground leading-tight cursor-pointer">
                Я подтверждаю, что мне есть 16 лет, я прочитал(а) и соглашаюсь с{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Правилами пользования и Политикой конфиденциальности
                </Link>
              </Label>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword('');
              setAgeConfirmed(false);
            }}
            className="text-primary hover:underline text-sm"
          >
            {isLogin
              ? 'Нет аккаунта? Зарегистрируйтесь'
              : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </Card>
    </div>
  );
}
