
$(() => {
  $('#search').change(() => {
    $('#bookmarks').empty();
    dumpBookmarks($('#search').val());
  });
});

function dumpBookmarks(query) {
  const bookmarkTreeNodes = chrome.bookmarks.getTree(bookmarkTreeNodes => {
    $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
  });
}

function dumpTreeNodes(bookmarkNodes, query) {
  const list = $('<ul>');
  let i;
  for (i = 0; i < bookmarkNodes.length; i++) {
    list.append(dumpNode(bookmarkNodes[i], query));
  }
  return list;
}

function dumpNode({ title, children, url, id }, query) {
  if (title) {
    if (query && !children) {
      if (!String(title).includes(query)) {
        return $('<span></span>');
      }
    }
    const anchor = $('<a>');
    anchor.attr('href', url);
    anchor.text(title);
    anchor.click(() => {
      chrome.tabs.create({ url: url });
    });
    var span = $('<span>');
    const options = children ? $('<span>[<a href="#" id="addlink">Add</a>]</span>') : $('<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" href="#">Delete</a>]</span>');
    const edit = children ? $('<table><tr><td>Name</td><td><input id="title"></td></tr><tr><td>URL</td><td><input id="url"></td></tr></table>') : $('<input>');

    function onSpanHover() {
      span.append(options);
      $('#deletelink').click(() => {
        $('#deletedialog').empty().dialog({
          autoOpen: false,
          title: 'Confirm Deletion',
          resizable: false,
          height: 140,
          modal: true,
          overlay: {
            backgroundColor: '#000',
            opacity: 0.5
          },
          buttons: {
            'Yes, Delete It!': function () {
              chrome.bookmarks.remove(String(id));
              span.parent().remove();
              $(this).dialog('destroy');
            },
            Cancel() {
              $(this).dialog('destroy');
            }
          }
        }).dialog('open');
      });
      $('#addlink').click(() => {
        $('#adddialog').empty().append(edit).dialog({
          autoOpen: false,
          closeOnEscape: true,
          title: 'Add New Bookmark',
          modal: true,
          buttons: {
            'Add': function () {
              chrome.bookmarks.create({
                parentId: id,
                title: $('#title').val(),
                url: $('#url').val()
              });
              $('#bookmarks').empty();
              $(this).dialog('destroy');
              window.dumpBookmarks();
            },
            'Cancel': function () {
              $(this).dialog('destroy');
            }
          }
        }).dialog('open');
      });
      $('#editlink').click(() => {
        edit.val(anchor.text());
        $('#editdialog').empty().append(edit).dialog({
          autoOpen: false,
          closeOnEscape: true,
          title: 'Edit Title',
          modal: true,
          show: 'slide',
          buttons: {
            'Save': function () {
              chrome.bookmarks.update(String(id), {
                title: edit.val()
              });
              anchor.text(edit.val());
              options.show();
              $(this).dialog('destroy');
            },
            'Cancel': function () {
              $(this).dialog('destroy');
            }
          }
        }).dialog('open');
      });
      options.fadeIn();
    }

    function onSpanUnHover() {
      options.remove();
    }

    span.hover(onSpanHover, onSpanUnHover).append(anchor);
  }
  const li = $(title ? '<li>' : '<div>').append(span);
  if (children && children.length > 0) {
    li.append(dumpTreeNodes(children, query));
  }
  return li;
}

document.addEventListener('DOMContentLoaded', () => {
  dumpBookmarks();
});
