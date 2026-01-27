import { Response, NextFunction } from 'express'
import * as notificationService from '../services/notificationService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export async function getNotificationsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

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

    await notificationService.markAllNotificationsAsRead(req.userId)

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
