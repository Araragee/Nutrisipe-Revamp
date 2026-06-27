import { Response, NextFunction } from 'express'
import * as notificationService from '../services/notificationService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { parsePagination } from '../utils/pagination'

export async function getNotificationsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { page, limit } = parsePagination(req)

    const result = await notificationService.getNotifications(req.userId, page, limit)

    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export async function markAsReadHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { notificationId } = req.params
    const notification = await notificationService.markNotificationAsRead(
      notificationId,
      req.userId
    )

    if (!notification) {
      throw new AppError(404, 'Notification not found or unauthorized')
    }

    res.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    next(error)
  }
}

export async function markAllAsReadHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    // Optional: the client may send the ids it observed as unread so only those
    // are marked, avoiding read-state divergence with notifications that arrived
    // after the client snapshot.
    const { notificationIds } = req.body ?? {}
    let ids: string[] | undefined
    if (notificationIds !== undefined) {
      if (!Array.isArray(notificationIds) || notificationIds.some((id) => typeof id !== 'string')) {
        throw new AppError(400, 'notificationIds must be an array of strings')
      }
      ids = notificationIds
    }

    await notificationService.markAllNotificationsAsRead(req.userId, ids)

    res.json({
      success: true,
      message: 'All notifications marked as read',
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteNotificationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { notificationId } = req.params
    const result = await notificationService.deleteNotification(notificationId, req.userId)

    if (!result) {
      throw new AppError(404, 'Notification not found or unauthorized')
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    })
  } catch (error) {
    next(error)
  }
}
