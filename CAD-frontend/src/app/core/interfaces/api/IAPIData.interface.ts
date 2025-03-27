import {IPoint} from './IPoint.interface';
import {IPairOfIndices} from './IPairOfIndices.interface';
import {IPolygon} from './IPolygon.interface';

export interface IAPIData {
    points: IPoint[] | null;
    pairsOfIndices: IPairOfIndices[] | null;
    polygons: IPolygon[] | null;
    defaultComplexPoints: IPoint[] | null;
}
