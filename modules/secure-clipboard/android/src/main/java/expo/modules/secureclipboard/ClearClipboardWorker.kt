package expo.modules.secureclipboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import androidx.work.Worker
import androidx.work.WorkerParameters

const val KEY_COPIED_AT = "copiedAt"

// Runs via WorkManager so the clear happens even when the app process is
// frozen or killed after the user switches away. Only the clip's timestamp is
// passed in — never the secret, since WorkManager persists input data to disk.
class ClearClipboardWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    val clipboard = applicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
      ?: return Result.success()
    val copiedAt = inputData.getLong(KEY_COPIED_AT, -1L).takeIf { it >= 0 }
    if (isStillOurClip(clipboard, copiedAt)) clearClipboard(clipboard)
    return Result.success()
  }
}

// Leaves the clipboard alone if the user has copied something else since.
// Comparing timestamps avoids reading the clip, which on Android 12+ would
// show a "pasted from your clipboard" toast. When the app isn't focused
// Android 10+ hides the clipboard (description is null), and before API 26
// there's no timestamp — in both cases clear rather than leave the secret.
fun isStillOurClip(clipboard: ClipboardManager, copiedAt: Long?): Boolean {
  if (copiedAt == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true
  val description = runCatching { clipboard.primaryClipDescription }.getOrNull() ?: return true
  return description.timestamp == copiedAt
}

fun clearClipboard(clipboard: ClipboardManager) {
  runCatching {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      clipboard.clearPrimaryClip()
    } else {
      clipboard.setPrimaryClip(ClipData.newPlainText(null, ""))
    }
  }
}
