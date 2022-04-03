import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IncTemperatureSensorDataRequestDto } from '../dtos';
import { TempIncomingEvents, TempOutgoingEvents } from '../enums';
import { TemperatureSensorsService } from '../services';

@WebSocketGateway()
export class TemperatureSensorsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly _temperatureSensorsService: TemperatureSensorsService;
  private readonly _logger = new Logger(TemperatureSensorsGateway.name);
  @WebSocketServer() private readonly _wsServer: Server;
  private _clients: Socket[] = [];

  constructor(
    @Inject(forwardRef(() => TemperatureSensorsService))
    temperatureSensorsService: TemperatureSensorsService,
  ) {
    this._temperatureSensorsService = temperatureSensorsService;
  }

  /**
   * Right after the connection is established, this method is called.
   * @param client Is the socket client that is connected to the gateway.
   * @returns The list of active temperature sensors.
   */
  async handleConnection(client: Socket) {
    this._logger.log(
      `Client with ws id: ${client.id} connected to the ${TemperatureSensorsGateway.name} gateway`,
    );

    this._clients.push(client);

    const registeredSensors =
      await this._temperatureSensorsService.getRegisteredTemperatureSensors();
    client.emit(TempOutgoingEvents.TEMPERATURE_REGISTERED_SENSORS, {
      data: registeredSensors,
    });
  }

  /**
   * This method is called when the gateway is disconnected.
   * @param client Is the socket client that is disconnected from the gateway.
   */
  handleDisconnect(client: Socket) {
    this._logger.log(
      `Client with ws id: ${client.id} disconnected from the ${TemperatureSensorsGateway.name} gateway`,
    );
    this._clients = this._clients.filter((c) => c.id !== client.id);
  }

  /**
   * This method is called when the gateway is initialized.
   */
  afterInit() {
    this._logger.log('Temperature sensors websocket server initialized');
  }

  /**
   * Returns the temperature data from the cache for the given sensorId, usually you will need this method
   * to get the temperature data from the cache and send it to the client.
   * @param client Is the socket client that is connected to the gateway and that will receive the data.
   * @param payload Is the incoming data from the client which contains the sensor id
   * @returns The cached data for the given sensor id
   */
  @SubscribeMessage(TempIncomingEvents.TEMPERATURE_DATA)
  async handleMessage(
    client: Socket,
    payload: IncTemperatureSensorDataRequestDto,
  ) {
    this._logger.log(`Requested temperature data from ${payload.sensorId}`);
    const cachedData =
      await this._temperatureSensorsService.getTemperatureFromCache(
        payload.sensorId,
      );
    client.emit(
      `${TempOutgoingEvents.TEMPERATURE_UPDATE}-${payload.sensorId}`,
      { data: cachedData },
    );
  }

  /**
   * Emits a message to all the clients connected to the namespace temperature.
   * @param event Is the event that is emitted by the temperature sensor service
   * @param data Is the data that will be emitted to all the clients connected to the gateway
   */
  emitMessage(event: string, data: any) {
    this._wsServer.emit(event, data);
  }
}
