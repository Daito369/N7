const FAVICON_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACyUlEQVR4nO2Za2vUQBSG+1MU/KJ4Qc0m2V0r1WKV1mKlKCoURUVRCipKoSiKFYqiohS2dnvbXu3eL/2DxwQaqcsm805K8oKdD++33ZnzPExmzjB9R44ek8OcPnYB7BgB7ALYMQLYBbBjBLALYMcIYBfAjhHALoAdI4BdADtGALsAdmILyBd2JD+/Jbn5Dcn9KnlZkdzCouSKC5ItFiS7OOfl54ELzGw99vJQMtv3xdqeEOv3PS93xNq5JVZ5XJzyTcmVxwgCAPjs0ndxl74eUIAavr98I30BKLy7/NnLbHwBAPxAZZQgQAPeXfkUu0AEfrBynSEAh3dXP4qz+j6eAAB+qDJCEKAJ75TexhSghh+uDhMEaMI7pWlx1qb0BQDwo9Vr6QvQWfYBvL32Ruz1V3oCAPix6lWCAM1lH8Db6y+05kHgx2tDDAHYsv8rYA/e3pgUe/M5PA8Cf7t2hSAgxjcfwGc2n8LzIPB3a4PpC0Dg/WX/j4A9+KC9ReZB4CfqlwkCAPheG153b6+aB4F/UL/EEKCGD9vw9re3qnkQ+Ef1AYIAAN7/5nv9t7u9jZoHgX/SuEgQAMBH7fbdHV7Y7xD4Z43+9AUg8FG7PXqfR+AnGxcIAgB4f8OLHAO40iLwL5t5hgA1PHLUqa60CPzrZpYgAID3d3vVOKpbHQI/1XTTF4DAI+e8n6iLDQI/3XQIAgB45JwPEnaxQeDftWyGADW8f9Sh44X19gj8h5ZFEADAq5qc7vTq7RH4mdZ5ggAA3j/ndcbs1d4i8LPtc+kLQOCjOrywoN/8fvgv7bMEAQm+2OjCf2ufYQhI7sVGF/5H5zRBQMIvNjrwc51T6QtI+sVGB77QOUkQkPCLjR8Uvrh7giEg2RebIAj88u7x9AX8LzEC2AWwYwSwC2DHCGAXwI4RwC6AHSOAXQA7RgC7AHaMAHYB7Bx6AX8AbYDV9k/vnXwAAAAASUVORK5CYII=';

const PROPERTY_KEYS = {
  TODO: 'NEXUSHUB_TODO_ITEMS',
  FOLDERS: 'NEXUSHUB_LINK_FOLDERS',
};

/**
 * @param {string} filename
 * @return {string}
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * @param {any=} data
 * @return {{success: true, data: any}}
 */
function respondSuccess(data) {
  return { success: true, data: data }; // eslint-disable-line object-shorthand
}

/**
 * @param {string} message
 * @param {any=} details
 * @return {{success: false, error: string, details?: any}}
 */
function respondError(message, details) {
  var response = { success: false, error: message };
  if (details !== undefined) {
    response.details = details;
  }
  return response;
}

/**
 * @param {function(): any} fn
 * @param {string} errorMessage
 */
function ensureAuthorization(fn, errorMessage) {
  try {
    fn();
  } catch (error) {
    throw new Error(errorMessage + ': ' + error);
  }
}

/**
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  var page = e && e.parameter && e.parameter.page === 'timer' ? 'Timer' : 'Index';
  return HtmlService.createHtmlOutputFromFile(page)
    .setTitle('NexusHub - 統合ワークスペースポータル')
    .setFaviconUrl(FAVICON_DATA_URL);
}

/**
 * @return {{success: boolean, data?: {email: string, name: string}, error?: string}}
 */
function getUserInfo() {
  try {
    var user = Session.getActiveUser();
    var email = user.getEmail();
    return respondSuccess({ email: email, name: email });
  } catch (error) {
    Logger.log('getUserInfo failed: ' + error);
    return respondError('ユーザー情報を取得できませんでした。', error);
  }
}

/**
 * Gmail 権限を確認するヘルパー。
 */
function assertGmailScope() {
  ensureAuthorization(function() {
    GmailApp.getInboxUnreadCount();
  }, 'Gmail へのアクセス権限が必要です');
}

/**
 * Google カレンダー権限を確認するヘルパー。
 */
function assertCalendarScope() {
  ensureAuthorization(function() {
    CalendarApp.getDefaultCalendar();
  }, 'Google カレンダーへのアクセス権限が必要です');
}

/**
 * @return {{success:boolean,data?:{unreadCount:number,emails:Array},error?:string}}
 */
function getGmailData() {
  try {
    assertGmailScope();
    var threads = GmailApp.search('is:unread in:inbox', 0, 20);
    var emails = threads.map(function(thread) {
      var messages = thread.getMessages();
      var latest = messages[messages.length - 1];
      var snippet;
      try {
        snippet = latest.getPlainBody();
      } catch (e) {
        snippet = latest.getSnippet();
      }
      return {
        threadId: thread.getId(),
        subject: thread.getFirstMessageSubject() || '(件名なし)',
        from: latest.getFrom(),
        snippet: (snippet || '').replace(/\s+/g, ' ').substring(0, 120),
        date: latest.getDate().getTime(),
        messageCount: messages.length,
      };
    });
    return respondSuccess({ unreadCount: threads.length, emails: emails });
  } catch (error) {
    Logger.log('getGmailData failed: ' + error);
    return respondError('メール情報の取得に失敗しました。', error);
  }
}

/**
 * @param {{threadId: string}} payload
 * @return {{success: boolean, data?: {threadId: string}}}
 */
function markThreadAsRead(payload) {
  try {
    assertGmailScope();
    var thread = GmailApp.getThreadById(payload.threadId);
    thread.markRead();
    return respondSuccess({ threadId: payload.threadId });
  } catch (error) {
    Logger.log('markThreadAsRead failed: ' + error);
    return respondError('スレッドを既読にできませんでした。', error);
  }
}

/**
 * @param {{threadId: string}} payload
 * @return {{success: boolean}}
 */
function archiveThread(payload) {
  try {
    assertGmailScope();
    var thread = GmailApp.getThreadById(payload.threadId);
    thread.moveToArchive();
    return respondSuccess({ threadId: payload.threadId });
  } catch (error) {
    Logger.log('archiveThread failed: ' + error);
    return respondError('スレッドをアーカイブできませんでした。', error);
  }
}

/**
 * @typedef {Object} ChatConversation
 * @property {string} id
 * @property {string} title
 * @property {string} snippet
 * @property {string} author
 * @property {number} unreadCount
 * @property {string} classification
 * @property {string} url
 */

/**
 * @return {{success:boolean,data?:{conversations:ChatConversation[]},error?:string}}
 */
function getChatData() {
  try {
    // Google Chat API は標準サービスにないため、ここでは Gmail スレッドからの疑似データを生成する。
    var threads = GmailApp.search('label:chat is:unread', 0, 10);
    var conversations = threads.map(function(thread) {
      var messages = thread.getMessages();
      var latest = messages[messages.length - 1];
      var snippet;
      try {
        snippet = latest.getPlainBody();
      } catch (e) {
        snippet = latest.getSnippet();
      }
      return {
        id: thread.getId(),
        title: thread.getFirstMessageSubject() || latest.getFrom(),
        snippet: (snippet || '').replace(/\s+/g, ' ').substring(0, 80),
        author: latest.getFrom(),
        unreadCount: thread.getUnreadCount(),
        classification: thread.getLabels().length > 0 ? 'spaces' : 'dm',
        url: thread.getPermalink(),
      };
    });
    return respondSuccess({ conversations: conversations });
  } catch (error) {
    Logger.log('getChatData failed: ' + error);
    return respondError('チャット情報の取得に失敗しました。', error);
  }
}

/**
 * @param {{chatId: string}} payload
 * @return {{success:boolean}}
 */
function markChatAsRead(payload) {
  try {
    assertGmailScope();
    var thread = GmailApp.getThreadById(payload.chatId);
    thread.markRead();
    return respondSuccess({ chatId: payload.chatId });
  } catch (error) {
    Logger.log('markChatAsRead failed: ' + error);
    return respondError('チャットを既読にできませんでした。', error);
  }
}

/**
 * @return {{success:boolean,data?:{events:Array},error?:string}}
 */
function getCalendarEvents() {
  try {
    assertCalendarScope();
    var now = new Date();
    var end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    var events = CalendarApp.getDefaultCalendar().getEvents(now, end).map(function(event) {
      return {
        id: event.getId(),
        title: event.getTitle(),
        start: event.getStartTime().getTime(),
        end: event.getEndTime().getTime(),
        description: event.getDescription(),
      };
    });
    return respondSuccess({ events: events });
  } catch (error) {
    Logger.log('getCalendarEvents failed: ' + error);
    return respondError('カレンダー情報の取得に失敗しました。', error);
  }
}

function getUserProperties() {
  return PropertiesService.getUserProperties();
}

/**
 * @return {{success:boolean,data?:{items:Array},error?:string}}
 */
function getTodoItems() {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.TODO);
    var items = raw ? JSON.parse(raw) : [];
    return respondSuccess({ items: items });
  } catch (error) {
    Logger.log('getTodoItems failed: ' + error);
    return respondError('Todo の取得に失敗しました。', error);
  }
}

/**
 * @param {{id?:string,title:string,due:?string,note:?string}} payload
 */
function createTodo(payload) {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.TODO);
    var items = raw ? JSON.parse(raw) : [];
    var id = payload.id || Utilities.getUuid();
    var todo = {
      id: id,
      title: payload.title,
      note: payload.note || '',
      due: payload.due || '',
      listName: 'デフォルト',
      completed: false,
    };
    items.push(todo);
    props.setProperty(PROPERTY_KEYS.TODO, JSON.stringify(items));
    return respondSuccess({ item: todo });
  } catch (error) {
    Logger.log('createTodo failed: ' + error);
    return respondError('Todo の作成に失敗しました。', error);
  }
}

/**
 * @param {{id:string,title:?string,due:?string,note:?string}} payload
 */
function updateTodo(payload) {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.TODO);
    var items = raw ? JSON.parse(raw) : [];
    var updated = items.map(function(item) {
      if (item.id === payload.id) {
        item.title = payload.title || item.title;
        item.due = payload.due || item.due;
        item.note = payload.note || item.note;
      }
      return item;
    });
    props.setProperty(PROPERTY_KEYS.TODO, JSON.stringify(updated));
    return respondSuccess({ id: payload.id });
  } catch (error) {
    Logger.log('updateTodo failed: ' + error);
    return respondError('Todo の更新に失敗しました。', error);
  }
}

/**
 * @param {{id:string,completed:boolean}} payload
 */
function toggleTodo(payload) {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.TODO);
    var items = raw ? JSON.parse(raw) : [];
    items.forEach(function(item) {
      if (item.id === payload.id) {
        item.completed = payload.completed;
      }
    });
    props.setProperty(PROPERTY_KEYS.TODO, JSON.stringify(items));
    return respondSuccess({ id: payload.id, completed: payload.completed });
  } catch (error) {
    Logger.log('toggleTodo failed: ' + error);
    return respondError('Todo の更新に失敗しました。', error);
  }
}

/**
 * @param {{id:string}} payload
 */
function deleteTodo(payload) {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.TODO);
    var items = raw ? JSON.parse(raw) : [];
    var filtered = items.filter(function(item) { return item.id !== payload.id; });
    props.setProperty(PROPERTY_KEYS.TODO, JSON.stringify(filtered));
    return respondSuccess({ id: payload.id });
  } catch (error) {
    Logger.log('deleteTodo failed: ' + error);
    return respondError('Todo の削除に失敗しました。', error);
  }
}

/**
 * @return {{success:boolean,data?:{folders:Array},error?:string}}
 */
function getLinkFolders() {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.FOLDERS);
    var folders = raw ? JSON.parse(raw) : [];
    return respondSuccess({ folders: folders });
  } catch (error) {
    Logger.log('getLinkFolders failed: ' + error);
    return respondError('リンクフォルダの取得に失敗しました。', error);
  }
}

/**
 * @param {{folderId:string,linkId:string,position:number}} payload
 */
function reorderLink(payload) {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.FOLDERS);
    var folders = raw ? JSON.parse(raw) : [];
    folders.forEach(function(folder) {
      if (folder.id === payload.folderId) {
        var links = folder.links || [];
        var index = links.findIndex(function(link) { return link.id === payload.linkId; });
        if (index > -1) {
          var link = links.splice(index, 1)[0];
          links.splice(payload.position, 0, link);
          folder.links = links;
        }
      }
    });
    props.setProperty(PROPERTY_KEYS.FOLDERS, JSON.stringify(folders));
    return respondSuccess({ folderId: payload.folderId });
  } catch (error) {
    Logger.log('reorderLink failed: ' + error);
    return respondError('リンクの並び替えに失敗しました。', error);
  }
}

/**
 * @param {{folderId:string}} payload
 */
function createLink(payload) {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.FOLDERS);
    var folders = raw ? JSON.parse(raw) : [];
    folders.forEach(function(folder) {
      if (folder.id === payload.folderId) {
        folder.links = folder.links || [];
        folder.links.push({
          id: Utilities.getUuid(),
          title: '新しいリンク',
          url: 'https://example.com',
        });
      }
    });
    props.setProperty(PROPERTY_KEYS.FOLDERS, JSON.stringify(folders));
    return respondSuccess({ folderId: payload.folderId });
  } catch (error) {
    Logger.log('createLink failed: ' + error);
    return respondError('リンクの追加に失敗しました。', error);
  }
}

/**
 * @param {{folderId:string,linkId:string}} payload
 */
function removeLink(payload) {
  try {
    var props = getUserProperties();
    var raw = props.getProperty(PROPERTY_KEYS.FOLDERS);
    var folders = raw ? JSON.parse(raw) : [];
    folders.forEach(function(folder) {
      if (folder.id === payload.folderId) {
        folder.links = (folder.links || []).filter(function(link) {
          return link.id !== payload.linkId;
        });
      }
    });
    props.setProperty(PROPERTY_KEYS.FOLDERS, JSON.stringify(folders));
    return respondSuccess({ folderId: payload.folderId });
  } catch (error) {
    Logger.log('removeLink failed: ' + error);
    return respondError('リンクの削除に失敗しました。', error);
  }
}

/**
 * @param {{folderId:string}} payload
 */
function openFolderMenu(payload) {
  Logger.log('openFolderMenu called for folder: ' + payload.folderId);
  return respondSuccess({ folderId: payload.folderId });
}
