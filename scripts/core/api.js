function hasGoogleScriptRun() {
  return typeof google !== 'undefined' && google.script && google.script.run;
}

function callServer(functionName, payload = {}) {
  if (!hasGoogleScriptRun()) {
    let data = null;
    switch (functionName) {
      case 'getGmailData':
        data = {
          unreadCount: 2,
          emails: [
            {
              threadId: 'mock-thread-1',
              subject: 'デザインレビューのご案内',
              from: 'Product Team',
              snippet: '最新のUI設計についてコメントをお願いします。',
              date: Date.now(),
              messageCount: 3,
            },
            {
              threadId: 'mock-thread-2',
              subject: '請求書の送付',
              from: 'Finance',
              snippet: '4月分の請求書を送付いたします。',
              date: Date.now() - 3600000,
              messageCount: 1,
            },
          ],
        };
        break;
      case 'getChatData':
        data = {
          conversations: [
            {
              id: 'chat-1',
              title: 'UX Guild',
              snippet: 'Figmaファイルを更新しました。',
              author: 'Ayaka',
              unreadCount: 5,
              classification: 'spaces',
              url: '#',
            },
            {
              id: 'chat-2',
              title: 'Taro Yamamoto',
              snippet: '今日の1on1よろしくお願いします。',
              author: 'Taro',
              unreadCount: 1,
              classification: 'dm',
              url: '#',
            },
          ],
        };
        break;
      case 'getTodoItems':
        data = {
          items: [
            {
              id: 'todo-1',
              title: 'M3トークン仕様を整理',
              due: new Date().toISOString(),
              listName: 'Design',
              note: '配色とタイプスケールを決定する',
              completed: false,
            },
          ],
        };
        break;
      case 'getCalendarEvents':
        data = {
          events: [
            {
              id: 'event-1',
              title: 'Daily Standup',
              start: Date.now() + 3600000,
              end: Date.now() + 5400000,
              description: '進捗共有とブロッカー確認',
            },
          ],
        };
        break;
      case 'getLinkFolders':
        data = {
          folders: [
            {
              id: 'folder-1',
              name: 'プロダクト',
              color: '#6750a4',
              links: [
                { id: 'link-1', title: 'デザインガイド', url: 'https://m3.material.io/' },
                { id: 'link-2', title: 'ロードマップ', url: '#' },
              ],
            },
          ],
        };
        break;
      default:
        data = null;
        break;
    }
    return Promise.resolve({ success: true, data });
  }
  return new Promise((resolve) => {
    google.script.run
      .withSuccessHandler((response) => resolve(response))
      .withFailureHandler((error) => resolve({ success: false, error: error && error.message ? error.message : String(error) }))
      [functionName](payload);
  });
}

async function fetchAndRender({
  fetcher,
  renderer,
  onLoading,
  onError,
}) {
  try {
    onLoading?.();
    const response = await fetcher();
    if (response && response.success) {
      renderer(response.data ?? response);
    } else {
      const message = response?.error || 'データ取得に失敗しました。';
      onError?.(message);
    }
  } catch (error) {
    console.error(error);
    onError?.(error.message || '予期せぬエラーが発生しました。');
  }
}

export { callServer, fetchAndRender };
