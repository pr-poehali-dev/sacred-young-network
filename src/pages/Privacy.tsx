import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад
        </Button>

        <div className="bg-card border-2 border-primary rounded-lg p-8">
          <h1 className="text-4xl font-bold text-primary mb-6">Политика конфиденциальности</h1>

          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных 
                пользователей социальной сети. Используя наш сервис, вы соглашаетесь с условиями данной политики.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">2. Собираемые данные</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Мы собираем следующие категории персональных данных:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Email адрес и имя пользователя при регистрации</li>
                <li>Информация профиля (имя, биография, фото профиля)</li>
                <li>Контент, который вы публикуете (посты, комментарии, сообщения)</li>
                <li>Данные о взаимодействии с другими пользователями</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">3. Использование данных</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Ваши персональные данные используются для:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Предоставления доступа к функциям социальной сети</li>
                <li>Персонализации контента и рекомендаций</li>
                <li>Обеспечения безопасности и предотвращения мошенничества</li>
                <li>Улучшения качества сервиса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">4. Защита данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы применяем современные технические и организационные меры для защиты ваших персональных данных 
                от несанкционированного доступа, изменения, раскрытия или уничтожения. Все пароли хранятся в 
                зашифрованном виде с использованием надежных алгоритмов хеширования.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">5. Права пользователей</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Вы имеете право:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Получать доступ к своим персональным данным</li>
                <li>Исправлять неточные данные</li>
                <li>Удалять свой аккаунт и все связанные данные</li>
                <li>Ограничивать обработку ваших данных</li>
                <li>Получать копию ваших данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">6. Файлы cookie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы используем файлы cookie для обеспечения работы сервиса, сохранения сеанса пользователя и 
                улучшения пользовательского опыта. Вы можете настроить свой браузер для блокировки cookie, 
                однако это может ограничить функциональность сайта.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">7. Возрастные ограничения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Наш сервис предназначен для пользователей старше 16 лет. Мы не собираем намеренно персональные 
                данные лиц младше 16 лет. Если вам стало известно, что несовершеннолетний предоставил нам 
                персональные данные, пожалуйста, свяжитесь с нами для удаления такой информации.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">8. Изменения в политике</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы можем периодически обновлять данную Политику конфиденциальности. О существенных изменениях 
                мы уведомим вас по электронной почте или через уведомление на сайте. Рекомендуем регулярно 
                проверять эту страницу для ознакомления с актуальной версией политики.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">9. Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed">
                Если у вас есть вопросы по данной Политике конфиденциальности или вы хотите воспользоваться 
                своими правами относительно персональных данных, пожалуйста, свяжитесь с нами по адресу: 
                support@example.com
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-primary/20">
              <p className="text-sm text-muted-foreground">
                Последнее обновление: {new Date().toLocaleDateString('ru-RU', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-card border-t-2 border-primary mt-12 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Социальная сеть. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
