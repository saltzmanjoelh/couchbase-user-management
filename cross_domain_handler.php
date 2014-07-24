<?php
	// error_reporting(E_ALL);
	// ini_set('display_errors','On');
	
	$CB_SERVER_URL = "http://127.0.0.1:8091";
	$SYNC_GATEWAY_ADMIN_URL = "http://127.0.0.1:4985";
	
	header('Content-Type: application/json');	
	header("Access-Control-Allow-Origin: {$CB_SERVER_URL}");
	header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
	header('Access-Control-Max-Age: 1000');
	header('Access-Control-Allow-Headers: pragma, accept, cache-control, origin, invalid-auth-response, content-type');
	
	$syncGatewayQuery = NULL;
	$JSONStr = NULL;
	if($_SERVER['REQUEST_METHOD'] == "GET"){
		//parse the query we need to perform
		$syncGatewayQuery = $_GET['sync_gateway_query'];
	}
	else{//PUT, POST or DELETE, get the request body
		//php doesn't handle json in the request body it's raw text
		$JSONObj = json_decode(file_get_contents("php://input"), true) ?: [];
		if(!isset($JSONObj['sync_gateway_query'])){
			echo json_encode(array("error"=>"sync_gateway_query key must be provided.".print_r($JSONObj, true)));
			return;
		}
		$syncGatewayQuery = $JSONObj['sync_gateway_query'];
		unset($JSONObj['sync_gateway_query']);
		$JSONStr = json_encode($JSONObj);
	}
	
	//curl to the sync gateway
	$ch = curl_init();
	$timeout = 5;
	$url = $SYNC_GATEWAY_ADMIN_URL.$syncGatewayQuery;//perform the query

	if ($ch == false){
		echo json_encode(array("error"=>"curl init failed."));
		return;
	}

	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_VERBOSE, 1);
	curl_setopt($ch, CURLINFO_HEADER_OUT, true);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
	if($JSONStr != NULL){
		curl_setopt($ch, CURLOPT_POSTFIELDS, $JSONStr);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Content-Length: ' . strlen($JSONStr)));
	}
	$data = curl_exec($ch);
	if($data === false){
		$error = "Curl Error Number ". curl_errno($ch). ": ". curl_error($ch);
		echo json_encode(array("error"=>$error));
	}
	else{
		$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		if($httpCode > 204){
			$data = $httpCode. ": ". $data;
		}
		echo $data;
	}
	curl_close($ch);
	
	
?>
