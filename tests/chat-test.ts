
import { aiResponse  } from '../ChatHandler'

export async function talk(){

    console.log('IM FUCKING RUNN ING')


    const response = await aiResponse('WHAT IS MY NAME', '122');
    console.log(response);


    
}


talk()